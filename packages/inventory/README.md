# @grr/inventory

> Keeping track of modules, packages, and repositories.

This package provides mostly asynchronous, promise-based operations for locating
and reading a repository's `package.json` manifest, for the locating nested
packages in a larger monorepo with a `workspaces` configuration, for updating a
dependency across all packages of a monorepo, and for analyzing cached code,
e.g., modules that have been instrumented for coverage by __nyc__. In short,
this package provides convenient building blocks so that you can more easily
write your own repository-specific build scripts.

This package does assume that the versions of all dependencies are fully spelled
out and no wildcard matching according to, say, [semantic
versioning](https://semver.org) is performed. This assumption is reflects the
realization that semantic versioning may convey an expectation about the impact
of a package upgrade but it cannot guarantee the actual impact. In fact, given
enough time and sufficiently many dependencies, the expectation is all but
guaranteed to be violated by some package upgrade. Fully spelling out versions
is intended to encourage a practice of well-prepared upgrades that are always
paired with thorough testing.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
