# js-junction

Welcome to [Robert Grimm](http://apparebit.com)'s monorepo for all things
JavaScript. While Robert is known as [apparebit](https://github.com/apparebit)
on GitHub, he uses the onomatopoetic alias [grr](https://www.npmjs.com/~grr) on
npm. He also [keeps
notes](https://github.com/apparebit/js-junction/tree/master/notes.md) on his
experiences with Node.js.

## 1. Packages Start With @grr

Conveniently, the latter name also serves as namespace for this repository's
open source packages:

 *  [mark-of-dev](https://github.com/apparebit/js-junction/tree/master/packages/mark-of-dev):
    Advancing the globalization of `__DEV__`.

 *  [@grr/typical](https://github.com/apparebit/js-junction/tree/master/packages/typical):
    Type combinators for data validation and modelling.

 *  [@grr/err](https://github.com/apparebit/js-junction/tree/master/packages/err):
    The joy of refined errors — with code, pun, and Oxford comma.

 *  [@grr/sequitur](https://github.com/apparebit/js-junction/tree/master/packages/sequitur):
    Fluent and lazy combinators for `next()` and `yield`.

 *  [@grr/oddjob](https://github.com/apparebit/js-junction/tree/master/packages/oddjob):
    Letting you focus on the flying circus.

 *  [@grr/inventory](https://github.com/apparebit/js-junction/tree/master/packages/inventory):
    Keeping track of modules, packages, and repositories.

 *  [@grr/knowledge](https://github.com/apparebit/js-junction/tree/master/packages/knowledge):
    Making the JSON-LD flavor of Schema.org palatable.

 *  [@grr/proact](https://github.com/apparebit/js-junction/tree/master/packages/proact):
    Making server-side rendering great again.

 *  [@grr/enact](https://github.com/apparebit/js-junction/tree/master/packages/enact):
    Making server-side rendering progressively scalable.

 *  [@grr/metaweb](https://github.com/apparebit/js-junction/tree/master/packages/metaweb):
    Practical website metadata based on Schema.org and encoded as plain JSON.

 *  [@grr/metawebpage](https://github.com/apparebit/js-junction/tree/master/packages/metawebpage):
    View components for rendering best practices `<html>` and `<head>`.

### 💯  Test Coverage Is Maximal 

All packages in this repository have 100% test coverage across statements,
branches, functions, and lines alike. Anything less would be uncivilized — and a
tad reckless for a dynamically typed programming language!


### 🆕  Upgrades Are Deliberate

All packages in this repository follow [semantic
versioning](https://semver.org). As a widely accepted convention for encoding an
_expectation_ about the scope and impact of a package upgrade, semantic
versioning certainly is helpful. However, as a convention, semantic versioning
cannot provide a _guarantee_ about the impact of an upgrade. In fact, given
enough time and sufficiently many dependencies, we'd expect semantic versioning
to fail, for instance, a minor version change for an update that includes a
breaking API change (which may have slipped into the release).

Given that reality, it would be a bit naive to use version ranges in this
repository's manifests and then pick up any allowable change more or less by
chance. Instead, this repository rejects wildcard matching on versions
altogether and the version numbers of all dependencies must be fully specified.
As a result, any upgrade, no matter how seemingly minor, requires human
intervention and testing, though the [version.js](/scripts/version.js) script
does help.

## 2. Modules End With .js

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
