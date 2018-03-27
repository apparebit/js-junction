# @grr/semantic-proact

> Automating content generation through structured site description.

This package leverages a description of a website using the
[Schema.org](http://schema.org) vocabulary and formatted as
[JSON-LD](https://json-ld.org) to automatically generate content. Notably, it
defines view components for a page's `<head>` including metadata, simple
top-level `<header>` and `<footer>` elements, and `<a>` links, which are
automatically annotated with appropriate `rel` and `aria-current` attributes. At
a less general but also higher level, it also includes a view component to
generate a person's curriculum vitae. Since all these components draw on the
same site description, this package also includes necessary support for reading,
validating, and querying the description.

--------------------------------------------------------------------------------

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
