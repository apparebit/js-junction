# Notes on Node.js Development

## 1. Too Many Packages, Not Enough Utility

A priori, isolating distinct functional concerns into separate modules and
packages to improve code reuse is a Good Thing™. But many participants in the
Node.js community have taken one of many criteria for high-quality source code
and pushed it ad absurdum — seemingly favoring one function per module, no
matter how trivial the implementation and its API contract. The costs of this
overindulgence in modularity became all too visible in 2016, when a bone-headed
coporate name grab escalated to the point of one package author [unpublishing
273 npm packages](http://azer.bike/journal/i-ve-just-liberated-my-modules). The
incident [exposed several
weaknesses](http://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm) in the
Node.js ecosystem, the most important being that left padding a string is
sufficiently trivial not to be delegated to some arbitrary package.

Pulling back, there usually is no clear-cut answer to the question of what
constitutes a distinct concern worthy of a distinct module or package. Many
factors play a role, including algorithmic and implementation complexity, the
API surface of offered functionality, the overhead of modules and packages
notably in terms of storage and main memory, and the cognitive impact of too
little or too much abstraction. Each package sourced from arbitrary authors also
represents the potential of surprising and hard-to-fix bugs or, worse, malignant
code. Each such package also requires some administrative overhead to ensure
license compliance. Unfortunately, the latter is all too often treated as an
afterthought. Yet, all of open source depends on our ability to channel
copyright law into open source licensing and thus requires us to faithfully
comply with both spirit and letter of the license.

## 2. Testing

### Measuring Code Coverage

Reliably collecting code coverage with popular Node.js tools has been an
exercise in frustration due to tool complexity and brittleness. Notably,
[node-tap](https://github.com/tapjs/node-tap) is at the lower end of the
complexity spectrum for a test runner. Yet, it internally relies on
[nyc](https://github.com/istanbuljs/nyc) for code coverage, which in turn relies
on [istanbul.js](https://github.com/istanbuljs/istanbuljs) to do the heavy
lifting. All three are mature Node.js projects and critical to the entire
ecosystem. Yet, they also are rather buggy, build on unfortunate abstractions,
and seemingly suffer from insufficient corporate sponsorship.

A more recent effort, [esm](https://github.com/standard-things/esm) or
__@std/esm__ during its hard-charging childhood, further complicates matters.
The package (finally) provides a production-worthy implementation of ECMAScript
modules for Node.js. But it only reached version 1.0 in March 2018 — make that
3.0 thanks to a hostile package name takeover. In my experience, __esm__ just
works for the most part. It also avoids the sprawling complexity of
[Babel](https://babeljs.io), making __esm__ a very welcome addition to the
ecosystem.

But __esm__ also has a knack for triggering test and coverage bugs. In case of
[js-junction](https://github.com/apparebit/js-junction), that knack manifested
itself in coverage not working with __@std/esm__ 0.19.0 through __esm__ 3.0.0
and again not working from 3.0.17 through 3.0.34. The period between 3.0.0 and
3.0.17 reflects the aftermath of what turned out to be an incomplete fix. At the
time, I incorrectly assumed — of course, backed by test runs — that isolating
tests into separate processes would make a difference. It does not. Instead,
two other changes to __js-junction__'s test harness did make a difference.

First, instead of relying on both include and exclude configurations, _start
__nyc__ in the correct working directory_. For example, that is `packages` for
__js-junction__. Changing the working directory does not make configuration much
easier, since it now becomes necessary to configure the `temp-directory` (to
`../.nyc-output`) and the `report-dir` (to `../coverage`). But it does make it
easier to correctly predict the effects of the configuration.

Second, _delete all cached code_ for both __esm__ and __nyc__ both before and
after running tests with coverage. By default, the caches are in
`node_modules/.cache/esm` and `node_modules/.cache/nyc`, which[] suggests to
simply delete `node_modules/.cache`. However, there are two potential pitfalls:
First, in a monorepo, there may be more than one `node_modules` directory, i.e.,
one for the repository and one for each package. All of their `.cache`
subdirectories must be deleted. Second, if the code deleting the caches runs
under Node.js, it shouldn't use __esm__. That package writes cache metadata on
process exit, which may just lead to the next invocation using the wrong code,
especially if you don't clean caches aggressively.

### Debugging Multiple Processes

When tests spawn additional processes, debugging also becomes a tad more
complicated, both for code running on the command line and within an IDE such as
[Visual Studio Code](https://code.visualstudio.com). The challenges are twofold.

First, each Node.js process must have its own, distinct debug port, on which it
accepts inspector protocol messages. Node.js rewrites debug ports automatically
when spawning child processes in the `cluster` module. But it does not do this
in general for APIs such as `child_process.spawn()`. Conveniently, however, the
solution approach is pretty much the same as for Node.js' cluster support: Check
`execArgv` for command line arguments such as `--inspect-brk=5000`, which
activate the debug mode, and rewrite such command line arguments to [use a
different port number for each
process](https://github.com/apparebit/js-junction/blob/a46b81917d2c5bfae6e1d723bf0bbf586fe13e0d/tests/index.js#L34-L57).

Second, the debugger must support multiple, concurrent debugees. Such a debugger
must have the ability to detect processes as they are spawned — directly or
indirectly by some other process — and to change their configuration on the fly,
notably through command line arguments and environment variables. Such a
debugger must also be able to manage breakpoints and step through source code
independent of currently active subprocesses and across handoffs between
subprocesses. Conveniently, Visual Studio Code's debugger does all that already.
It only takes a simple launch configuration, setting
`"autoAttachChildProcesses"` to `true`, and its debugger interfaces with more
than one process.

## 3. Lessons

The above pain points for Node.js engender the following lessons for the design
of high-level language runtimes and virtual machines.

### Extensible Loader

The first lesson concerns the design of the runtime loader, which locates,
loads, and instantiates configuration files, scripts, and binaries in memory. A
well-designed loader allows for several different input formats, enables
interposition for each format separately, and supports predictable composition
of several such hooks per format. At its most basic, that only requires
registration of a callback for a given format:

    register(format: string, transformer: Buffer => [format, Buffer]);

To avoid placing an a-priori constraint on expressivity, which, after all, is
the point of loader hooks, the callback transforms a bytestring to a bytestring
(plus format specifier). While flexible, that does complicate common uses for
loader hooks, which typically operate on abstract syntax trees. To avoid a
scenario where several callbacks each parse, analyze, transform, and serialize
the syntax tree, a more user-friendly loader should also support callbacks that
transform syntax trees and extensions to the parser that produces the syntax
trees.

### Libraries Over Command Line Tools

The second lesson concerns runtime support for testing. Node.js' ecosystem is
strangely skewed, offering both too many and too few options for critical
infrastructure — as nicely illustrated by the contrast between the many test
runners — including [AVA](https://ava.li/),
[intern](https://github.com/theintern/intern),
[Jasmine](https://jasmine.github.io), [Jest](https://github.com/facebook/jest),
[Karma](https://karma-runner.github.io/2.0/index.html),
[Mocha](http://mochajs.org/), [tap](https://github.com/isaacs/node-tap), and
[tape](https://github.com/substack/tape) — versus the one coverage collector
[Istanbul](https://istanbul.js.org). Yet, they all tend towards the overly
general and thus towards the complex. That makes for tempting convenience when
the use case is both well supported and amply documented. But it also makes for
obscure bugs and considerable frustration fixing them when your use case is
slightly different.

Instead, we should focus on convenient library support that lets developers
write the glue code for their own tools. This avoids the complexity and cruft
caused by too many requirements, while also encouraging developers to share
responsibility for their tooling. To put it differently, robust support for
spawning child processes, capturing their diagnostic output (preferably in a
JSON-based format), handling signals as well as messages, and formatting reports
for terminal and browser is far more valuable than yet another command line
tool, independent of whether it is futuristic or not.
