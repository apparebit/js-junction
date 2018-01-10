# @grr/proact

> Making server-side rendering great again!

Proact provides the foundation for user interface components on the web. It is,
of course, yet another component system inspired by Facebook‘s
[React](https://reactjs.org). In contrast to React, however, Proact‘s raison
d’être is to explore the design and API space when starting with the server
instead of the client. In other words, this package focuses on _proactive_
content generation, hence the name. Proact‘s modules are grouped into the
following directories:

  + `semantics` captures necessary domain knowledge about HTML elements and
    their attributes.

  * `content` defines the standard elements and custom components forming
    Proact‘s virtual DOM (vDOM).

  * `syntax` implements the rendering of vDOM components to vDOM elements to
    HTML text.

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
