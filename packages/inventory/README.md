# @grr/inventory

> Keeping track of modules, packages, and repositories.

This package provides mostly asynchronous, promise-based operations for locating
and reading a repository's `package.json` manifest, for the locating nested
packages in a larger monorepo with a `workspaces` configuration, for updating a
dependency across all packages of a monorepo, and for analyzing cached code,
e.g., modules that have been instrumented for coverage by __nyc__. In short,
this package provides convenient building blocks so that you can more easily
write your own repository-specific build scripts.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
