# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert may be known as [grimmr](https://github.com/grimmr) on
GitHub, he uses the onomatopoetic alias [grr](https://www.npmjs.com/~grr) on
npm. Conveniently, the latter also serves as namespace for his open source
packages:

 *  [@grr/oddjob](https://github.com/grimmr/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [@grr/proact](https://github.com/grimmr/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

All packages have 100% test coverage across statements, branches, functions,
and lines alike. Anything less would be uncivilized — and a tad reckless for a
dynamically typed programming language!

--------------------------------------------------------------------------------

## ECMAScript Only

This repository contains only ECMAScript modules with the `.js` file extension.
It may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [@std/esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 4.0.0 or later.

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
