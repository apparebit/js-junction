# @grr/enact

> Making server-side rendering progressively scalable!

This package is an attempt to define a convenient interface for
server-side view components that can scale from a trivial
implementation that just concatenates plain text to fully featured
view components familiar from [React](https://reactjs.org). Ideally,
it should do so _without_ requiring any modifications to application
code — besides of course a configuration change. Futhermore, it should
support all that without external tools such as a transpiler or module
bundler.

The key enabling technology that facilitates such a scalable view
engine implementation are JavaScript's tagged templates, which were
introduced with ES6 and provide a simple yet powerful hook for
instantiating data structures with a human-writable and readable
serialization format. In the simplest case, the tag function just
concatenates the strings without interpreting them in any way. In the
fully featured case, the tag function not only parses all static text
to ensure a well-formed hierarchy of view elements. But it avoids
repeatedly parsing the same text fragments by instantiating a suitable
factory function during the first parse and reusing it thereafter. Of
course, the implementation also ships those factory functions to the
client.

In other words, the hope is to eventually provide a lightweight
just-in-time transformation for such tagged templates, where React's
JSX requires a more complex transpilation, which is typically
performed ahead-of-time. Handling JSX is more complex than handling
tagged templates because JSX fragments must be translated before
execution and, as an extension to JavaScript's syntax, may appear
anywhere in a module. In contrast, tagged templates are implemented
natively and can be parsed one template at a time. Alas, for now, this
package supports the minimum viable product, i.e., plain text, only.

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
