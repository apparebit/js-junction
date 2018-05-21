# @grr/sequitur

> Refined iterators, iterables, and generator functions.

This package builds on ECMAScript's iterators, iterables, and generator
functions, provides handy tests for detecting them and constants to more easily
access them, and defines several functional combinators operating on arbitrary
iteration sequences. While many of the combinator names are familiar, this
package's versions differ by being (1) lazy, i.e., they only access an element
if strictly necessary, (2) fluent, i.e., they are implemented as methods to be
mixed into some iterable object and (3) reusable, i.e., the same chain of
combinators can be reused for more than one computation.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
