# @grr/proact-dom

> Proactive UI components and elements

This package defines the representation of components and elements for
serer-side rendering. Consistent with Proact's server-side bias, its DOM is not
virtual but rather _simple_ or _server-side_. Call it the _sDOM_ if you will!

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
