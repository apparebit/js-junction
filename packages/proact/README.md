# @grr/proact

> Making server-side rendering great again!

Proact provides the foundation for user interface components on the web. It is,
of course, yet another component system inspired by Facebook‘s
[React](https://reactjs.org). In contrast to React, however, Proact‘s raison
d’être is to explore the design and API space when starting with the server
instead of the client. In other words, this package focuses on _proactive_
content generation, hence the name. Proact‘s modules are grouped into the
following directories:

  * [semantics](semantics) captures necessary domain knowledge about HTML
    elements and their attributes.

  * [vdom](vdom) defines the standard elements and custom components forming
    Proact‘s lightweight document model, i.e., _virtual DOM_.

  * [driver](driver) provides scaffolding for traversing the vDOM and
    materializing the traversal's effects.

  * [html](html) implements concrete drivers to render the vDOM as HTML source
    code.

## API

The combined functionality of Proact's modules is exposed through narrow, public
API. Currently, it only supports server-side rendering. If a feature is not
documented here, it is internal only and subject to change even between patch
revisions.

### `componentize(renderFn, name = renderFn.name)`

Convert the render function into a functional component. The component's name
defaults to the function's name. When rendering a component, the render function
is invoked as

```javascript
component.render(context, props, children);
```

where the `context` is automatically passed down a vDOM tree, the `children` are
the component's main payload, and `props` are the rest of the component's
properties. Semantically, `context` and `children` are simply properties. They
are separately passed to `render()` as a convenience. However, to enforce proper
semantics, Proact check that `props` does not have properties named `context` or
`children` when running in `__DEV__`.

The render function returns a vDOM consisting of numbers, strings, arrays,
elements, and components. During rendering `undefined`, `null`, booleans, and
`NaN` are ignored, whereas nested arrays are flattened. All other values result
in an error.

### `h(type, [props,] ...children)`

Create a new vDOM element or component. The `type` either is a string naming the
HTML element or is a component created with `componentize()`. The `children` are
the node's main payload, whereas the optional `props` object provides further
properties.

As a convenience, the property `h.tag`, where `tag` is the name of an HTML
element, returns a function that, when invoked with some `...args`, creates an
element equivalent to `h('tag', ...args)`. These factory functions are
instantiated on-demand only and thereafter cached.

### `renderToString(node, { context = {} } = {})`

Render the vDOM rooted at `node` to a string. The `context` is available to all
components in the vDOM — unless an ancestor provides its own value by calling

```javascript
this.provideContext(newContext);
```

from within its render function.

### `renderToStream(node, { context = {} } = {})`

Render the vDOM rooted at `node` to a new Node.js readable stream. The `context`
is available to all components in the vDOM — unless an ancestor provides its own
value.

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
