# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert may be known as
[apparebit](https://github.com/apparebit) on GitHub, he uses
[grr](https://www.npmjs.com/~grr) on npm. Conveniently, the latter also serves
as namespace for this repository's open source packages:

 *  [`@grr/mark-of-dev`](https://github.com/apparebit/js-junction/tree/master/packages/mark-of-dev):
    Advancing the globalization of `__DEV__`.

 *  [`@grr/oddjob`](https://github.com/apparebit/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [`@grr/proact`](https://github.com/apparebit/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

All packages have 100% test coverage across statements, branches, functions, and
lines alike. Anything less would be uncivilized — and a tad reckless for a
dynamically typed programming language!

--------------------------------------------------------------------------------

## ECMAScript Only

This repository contains only ECMAScript modules with the `.js` file extension.
It may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

### Code Coverage Is Hard

It must be noted that reliably collecting code coverage with popular Node.js
tools is an exercise in frustration due to their complexity and brittleness. For
example, [`node-tap`](https://github.com/tapjs/node-tap) is at the lower end of
the complexity spectrum for a test runner. Yet, it internally relies on
[`nyc`](https://github.com/istanbuljs/nyc) for code coverage, which in turn
relies on [`istanbul.js`](https://github.com/istanbuljs/istanbuljs) to do the
heavy lifting. These are all mature, sizable, and buggy projects. They seemingly
suffer from insufficient sponsorship as well, yet are critical to the entire
ecosystem.

Worse, [`esm`](https://github.com/standard-things/esm), aka `@std/esm` during
its hard-charging childhood, is an implementation of ECMAScript modules that is
considerably more complete and lightweight than most. But it only reached
version 1.0 in March 2018 — actually 3.0, thanks to a hostile package takeover
to ditch the `@std` scope. In my experience, `esm` is fairly reasonable in
everyday use. But it has a knack for triggering test and coverage bugs. In the
case of `js-junction`, coverage stopped working with `@std/esm` 0.19.0 and was
still broken with `esm` 3.0.0.

It took me a couple of days of reading sources and documentation, coming up with
hypotheses for what might be the issue, and coding up just enough to test each
hypothesis. Eventually, I made two critical modifications. First, to ensure that
`nyc` instruments only `js-junction`'s production packages and modules but not
scripts and tests, I changed `nyc`'s working directory to `packages`. That in
turn required me to remap `.nyc_output` and `coverage` to the parent directory
of `packages` (i.e., `js-junction`'s root). Second, to ensure that `nyc` writes
out actual coverage for each package and module, I switched from running
`js-junction`'s per-package tests in-process to per-package child processes.
Thankfully, `node-tap`'s `spawn()` makes that an easy change.

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
