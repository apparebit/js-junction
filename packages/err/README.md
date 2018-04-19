# @grr/err

> The joy of refined errors — with code, pun, and Oxford comma.

At first approach, the __@grr/err__ package may growl or snarl a little. But it
really is quite friendly when you get to know it. The package's remit is to
simplify basic error handling. To that end, it takes inspiration from recent
changes to Node.js' internal error module and assigns each distinct error its
own distinct code. This eliminates the need for major version changes on
occasion of error message changes, while also avoiding the unnecessary overhead
of subtypes. Additionally, this packages implements punning for key-value
arguments, supporting the single `{ key }` argument as a more concise
alternative to distinct `key` and `value` arguments. It also helps format
well-formed error messages, notably by implementing that last vestige of
civilization in the English speaking world, the Oxford comma.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
