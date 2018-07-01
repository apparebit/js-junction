# @grr/sequitur

> Fluent and lazy combinators for iterators and generators

This package provides fluent combinators for iterators and generators in form of
a lightweight wrapper, the sequence abstraction `Sq`. That wrapper accepts
generator functions, iterables, generators, iterators, as well as explicit
values as the source iteration. It converts each into an iterator factory, which
appears to be the common core of all iteration abstractions in JavaScript.
Nonterminal combinators are lazy, consuming upstream elements only when there is
a downstream need. For now, sequences cannot include asynchronous operations.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
