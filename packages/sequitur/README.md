# @grr/sequitur

> Fluent and lazy combinators for iterators and generators

This package rounds up the usual suspects, i.e., functional combinators, and
makes them available to synchronous iterators and generators in form of a
lightweight wrapper. The reason said wrapper is feasible is that generator
functions, generators, iterables, and iterators alike can all be trivially
converted to a common representation, the _iterator factory_. In fact, generator
functions already are iterator factories and the sole `Symbol.iterator` method
of iterables only needs to be bound to the object that implements it. In theory,
transducers are a more elegant solution to the same problem. However, in
practice, they add implementation complexity since the transducer interface
requires an initialization and completion method in addition to the iteration
method as well. Furthermore, neither transducers nor this package's sequence
abstraction work with asynchronous iterators. That requires a substantially
different implementation using either generators with implicit continuations or
explicitly passed continuations.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
