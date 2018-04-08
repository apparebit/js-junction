# Notes on Node.js Development

## Too Many Packages, Not Enough Utility

A priori, isolating distinct functional concerns into separate modules and
packages to improve code reuse is a Good Thing™. But many participants in the
Node.js community have taken one amongst many criteria for high-quality software
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
factors play a role, including algorithm and implementation complexity, the API
surface of offered functionality, the overhead of modules and packages
especially in terms of storage and main memory, and the cognitive impact of too
little or too much abstraction. Each package sourced from arbitrary authors also
represents the potential of surprising or hard-to-fix bugs and, worse, malignant
code. Each such package also requires some administrative overhead to ensure
license compliance. Unfortunately, the latter is all too often treated as an
afterthought. At the same time, all of open source depends on our ability to
channel copyright law into licenses that enable sharing for the common good.

## Code Coverage

Reliably collecting code coverage with popular Node.js tools has been an
exercise in frustration due to tool complexity and brittleness. Notably,
[node-tap](https://github.com/tapjs/node-tap) is at the lower end of the
complexity spectrum for a test runner. Yet, it internally relies on
[nyc](https://github.com/istanbuljs/nyc) for code coverage, which in turn relies
on [istanbul.js](https://github.com/istanbuljs/istanbuljs) to do the heavy
lifting. All three are mature Node.js projects and critical to the entire
ecosystem. Yet, they also are rather buggy and seemingly suffer from
insufficient sponsorship.

A more recent effort, [esm](https://github.com/standard-things/esm) or @std/esm
during its hard-charging childhood, further complicates matters. That package
(finally) provides a production-worthy implementation of ECMAScript modules for
Node.js. But it only reached version 1.0 in March 2018 — actually 3.0 thanks to
a hostile package name takeover. In my experience, esm mostly just works while
also avoiding the sprawling complexity of [Babel](https://babeljs.io), which
makes it a very welcome addition to the ecosystem. But esm also has a knack for
triggering test and coverage bugs. In case of
[js-junction](https://github.com/apparebit/js-junction), coverage stopped
working with @std/esm 0.19.0 and was still broken when esm 3.0.0 was released.
That seemed pretty good indication that the problem was with js-junction's
particular setup.

It took me a couple of days of reading code and documentation, articulating
hypotheses for what might be the issue, and coding up just enough to test each
hypothesis. Eventually, I restored coverage by making two modifications. First,
to ensure that nyc instruments only js-junction's production packages and
modules but not auxiliary scripts and tests, I changed nyc's working directory
to `packages`. That, in turn, required remapping `.nyc_output` and `coverage` to
the `packages`' parent directory, i.e., js-junction's root. The lesson here is
to assume file inclusion as a default and not rely on nyc's broken `include`
configuration option. Second, to ensure that nyc writes out actual coverage for
each package and module, I switched from running js-junction's per-package tests
in-process to a child process per package. Thankfully, node-tap's `spawn()`
makes that an easy change.
