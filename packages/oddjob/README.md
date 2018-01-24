# `@grr/oddjob`

> Letting you focus on the flying circus!

This package provides an assortment of utility functions. The intent is to
abstract over the little annoyances when writing everyday JavaScript. This
includes detecting types, wrangling object properties, composing functions, and
raising errors. Consistent with the intent, Oddjob has *no* external
package dependencies and minimizes internal module dependencies. Surprisingly,
modules inside the `internal` directory are *not* part of this package's public
API.

## Notes

Oddjob's *key path* utilities allow strings, symbols, and numbers as property
keys. Treating numbers as valid keys gives more flexibility in programmatically
deriving keys. It also reflects the importance of arrays in the language, which
pretend to use integer keys. It is unclear, however, whether it isn't already
too late for such type concerns. After all, one pair of square brackets is all
that's needed to turn any value into a property key.

This package's *function wrappers* help enhance existing code by tapping
function and method invocations to perform additional work. While it might be
possible to rewrite every call site, it generally is preferable to just modify
the callee — by wrapping it in another entity that controls the original
function. The problem, however, is that JavaScript functions are objects — with
arbitrary properties *and* the special right to execute code. Before ES6, this
implied copying all properties from the wrapped function to the wrapper
function. Thankfully, proxies in ES6 make this much easier and more lightweight.

--------------------------------------------------------------------------------

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [@std/esm](https://github.com/standard-things/esm),
a light-weight just-in-time transpiler for Node.js 4.0.0 or later.

## Copyright and License

© 2017–2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
