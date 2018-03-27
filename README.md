# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert may be known as
[apparebit](https://github.com/apparebit) on GitHub, he uses
[grr](https://www.npmjs.com/~grr) on npm.

## Packages: Start With @grr

Conveniently, the latter also serves as namespace for this repository's open
source packages:

 *  [@grr/mark-of-dev](https://github.com/apparebit/js-junction/tree/master/packages/mark-of-dev):
    Advancing the globalization of `__DEV__`.

 *  [@grr/oddjob](https://github.com/apparebit/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [@grr/knowledge](https://github.com/apparebit/js-junction/tree/master/packages/knowledge):
    Making small corpora of JSON-LD convenient to process.

 *  [@grr/proact](https://github.com/apparebit/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

 *  [@grr/semantic-proact](https://github.com/apparebit/js-junction/tree/master/packages/semantic-proact):
    Automating content generation through structured site description.

All these packages have 100% test coverage across statements, branches,
functions, and lines alike. Anything less would be uncivilized — and a tad
reckless for a dynamically typed programming language! The one exception is
[apparebit-com](https://github.com/apparebit/js-junction/tree/master/packages/apparebit-com).
It contains content, styles, and behaviors for the eponymous website, some of
which require different forms of testing including spell and grammar checking.
More fundamentally, its utility as an installable package is by definition
limited and, consequently, apparebit-com is not published to the npm registry.

## Modules: Use ECMAScript Only

This repository contains only ECMAScript modules with the `.js` file extension.
It may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

### Sidebar: Code Coverage

It must be noted that reliably collecting code coverage with popular Node.js
tools has been an exercise in frustration due to tool complexity and
brittleness. Notably, [node-tap](https://github.com/tapjs/node-tap) is at the
lower end of the complexity spectrum for a test runner. Yet, it internally
relies on [nyc](https://github.com/istanbuljs/nyc) for code coverage, which in
turn relies on [istanbul.js](https://github.com/istanbuljs/istanbuljs) to do the
heavy lifting. All three are mature Node.js projects and critical to the entire
ecosystem. Yet, they also are rather buggy and seemingly suffer from
insufficient sponsorship.

A more recent effort, [esm](https://github.com/standard-things/esm) or @std/esm
during its hard-charging childhood, further complicates matters. That package
(finally) provides a production-worthy implementation of ECMAScript modules for
Node.js. But it only reached version 1.0 in March 2018 — actually, 3.0 thanks to
a package takeover. In my experience, esm mostly just works while also avoiding
the sprawling complexity of [Babel](https://babeljs.io). But it also has a knack
for triggering test and coverage bugs. In case of js-junction, coverage stopped
working with @std/esm 0.19.0 and was still broken when esm 3.0.0 was released.
That seemed pretty good indication that the problem was with js-junction's
particular setup.

It took me a couple of days of reading code and documentation, articulating
hypotheses for what might be the issue, and coding up just enough to test each
hypothesis. Eventually, I restored coverage by making two modifications. First,
to ensure that nyc instruments only js-junction's production packages and
modules but not auxiliary scripts and tests, I changed nyc's working directory
to `packages`. That, in turn, required remapping `.nyc_output` and `coverage` to
the `packages`' parent directory (i.e., js-junction's root). Second, to ensure
that nyc writes out actual coverage for each package and module, I switched from
running `js-junction`'s per-package tests in-process to per-package child
processes. Thankfully, `node-tap`'s `spawn()` makes that an easy change.

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
