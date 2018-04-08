# Notes on Node.js Development

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
