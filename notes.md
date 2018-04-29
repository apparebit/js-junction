# Notes on Node.js Development

## Too Many Packages, Not Enough Utility

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

## Code Coverage

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
ecosystem. But __esm__ also has a knack for triggering test and coverage bugs.
In case of [js-junction](https://github.com/apparebit/js-junction), coverage
stopped working with __@std/esm__ 0.19.0 and was still broken when __esm__ 3.0.0
was released. I took that as strong suggestion that the problem was with
__js-junction__'s particular setup and not [John-David
Dalton's](https://github.com/jdalton) package.

It took me a couple of days of reading code and documentation, articulating
several hypotheses for what might be the issue, and coding up just enough to
test each hypothesis. Eventually, I restored coverage by making two
modifications. First, to ensure that __nyc__ instruments only __js-junction__'s
production packages and modules but not auxiliary scripts and tests, I changed
__nyc__'s working directory to `packages`. That, in turn, required remapping
`.nyc_output` and `coverage` to the `packages`' parent directory, i.e.,
__js-junction__'s root. The lesson here is to assume file inclusion as a default
and not rely on __nyc__'s broken `include` configuration option. Second, to
ensure that __nyc__ writes out actual coverage for each package and module, I
switched from running __js-junction__'s per-package tests in-process to a child
process per package. Thankfully, __node-tap__'s `spawn()` makes that an easy
change.

### Surprise!

Partitioning tests into several processes not only ensures that coverage data is
correctly written out, but it can also speed up testing thanks to parallel
execution. Unfortunately, it also complicates debugging, both for code running
on the command line and within an IDE such as Visual Studio Code. The challenges
are twofold.

First, each Node.js process must have its own, distinct debug port, on which it
accepts inspector protocol messages. Node.js rewrites debug ports automatically
when spawning child processes in the `cluster` module, but it does not for more
general and flexible APIs such as `child_process.spawn()`. Conveniently, the
solution for js-junction's tests is quite similar to Node.js': Check `execArgv`
for command line flags, such as `—inspect-brk=5000`, that activate debug mode
and then rewrite that argument to [use a different, monotonically increasing
port number for each
process](https://github.com/apparebit/js-junction/tree/master/tests/index.js).

Second, the debugger must support multiple, concurrent debugees and, of course,
it needs to connect to each and every one of them through its own debug port.
More than conveniently, Visual Studio Code not only supports multiple,
concurrent debugees, it also has a launch configuration,
`"autoAttachChildProcesses"`, which makes it inspect the arguments for child
processes and to automatically connect to a child process that also is in debug
mode. Once both changes are in place, seamless debugging across all processes of
the test suite is reality.
