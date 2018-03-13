# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert may be known as
[apparebit](https://github.com/apparebit) on GitHub, he uses
[grr](https://www.npmjs.com/~grr) on npm. Conveniently, the latter also serves
as namespace for this repository's open source packages:

 *  [@grr/mark-of-dev](https://github.com/apparebit/js-junction/tree/master/packages/mark-of-dev):
    Advancing the globalization of `__DEV__`.

 *  [@grr/oddjob](https://github.com/apparebit/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [@grr/proact](https://github.com/apparebit/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

All packages have 100% test coverage across statements, branches, functions, and
lines alike. Anything less would be uncivilized — and a tad reckless for a
dynamically typed programming language!

It must be noted, however, that reliably collecting code coverage with popular
tools is an exercise in frustration due to their complexity and brittleness. For
example, [node-tap](https://github.com/tapjs/node-tap) is at the lower end of
the complexity spectrum for a test runner. Yet, it internally relies on
[nyc](https://github.com/istanbuljs/nyc) for code coverage, which in turn relies
on [istanbul.js](https://github.com/istanbuljs/istanbuljs) to do the heavy
lifting. These all are mature projects, yet are not exactly bug free.

Worse, [esm](https://github.com/standard-things/esm) — an implementation of
ECMAScript modules — only now reached 3.0 — which really is 1.0. After, coverage
broke with esm's 0.19.0, it took me a couple of days of reading tool code and
documentation as well as testing various hypotheses in code to make it work
again. First, to ensure that nyc instruments only production modules, I changed
its working directory to `packages` and remapped `.nyc_output` and `coverage` to
`packages`' parent. Second, to ensure that nyc writes out the coverage data for
each module, I switched from running per-package tests in one process to
per-package child processes. Thankfully, node-tap's `spawn()` makes that rather
simple.

--------------------------------------------------------------------------------

## ECMAScript Only

This repository contains only ECMAScript modules with the `.js` file extension.
It may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
