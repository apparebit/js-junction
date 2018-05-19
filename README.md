# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert is known as [apparebit](https://github.com/apparebit)
on GitHub, he uses the onomatopoetic alias [grr](https://www.npmjs.com/~grr) on
npm. He also [keeps
notes](https://github.com/apparebit/js-junction/tree/master/notes.md) on his
experiences with Node.js.

## Packages Start With @grr

Conveniently, the latter name also serves as namespace for this repository's
open source packages:

 *  [@grr/mark-of-dev](https://github.com/apparebit/js-junction/tree/master/packages/mark-of-dev):
    Advancing the globalization of `__DEV__`.

 *  [@grr/err](https://github.com/apparebit/js-junction/tree/master/packages/err):
    The joy of refined errors — with code, pun, and Oxford comma.

 *  [@grr/oddjob](https://github.com/apparebit/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [@grr/inventory](https://github.com/apparebit/js-junction/tree/master/packages/inventory):
    Keeping track of modules, packages, and repositories.

 *  [@grr/knowledge](https://github.com/apparebit/js-junction/tree/master/packages/knowledge):
    Making the JSON-LD flavor of Schema.org palatable.

 *  [@grr/proact](https://github.com/apparebit/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

All these packages have 100% test coverage across statements, branches,
functions, and lines alike. Anything less would be uncivilized — and a tad
reckless for a dynamically typed programming language!

## Modules End With .js

This repository contains only ECMAScript modules with the `.js` file extension.
It may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later. For the most part,
__esm__ just works. However, reliably determining code coverage can be
[surprisingly
tricky](https://github.com/apparebit/js-junction/tree/master/notes.md).

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
