# `@grr/oddjob`

> Letting you focus on the flying circus!

This package provides an assortment of utility functions. The intent is to
abstract over the little annoyances when writing everyday JavaScript. This
includes detecting types, wrangling object properties, composing functions, and
raising errors. Consistent with the intent, `@grr/oddjob` has *no* external
package dependencies and minimizes internal module dependencies. Surprisingly,
modules inside the `internal` directory are *not* part of this package's public
API.

Technically, JavaScript only supports strings and symbols as property keys. That
includes the empty string but does not include numbers, which, like all other
values, are transparently coerced to strings when using square-bracket notation.
Doing so seems too permissive, as it masks usually invalid keys such as
`undefined` or `null`. To support array indices while still providing (some)
error detection, this package makes a pragmatic compromise and treats strings,
symbols, and numbers as valid property keys.

--------------------------------------------------------------------------------

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [@std/esm](https://github.com/standard-things/esm),
a light-weight just-in-time transpiler for Node.js 4.0.0 or later.

## Copyright and License

© 2017 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
