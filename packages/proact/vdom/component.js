/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue, FunctionNotImplemented } from '@grr/oddjob/errors';
import Node from './node';

const { create, defineProperties, defineProperty } = Object;
const { toStringTag } = Symbol;
const NodePrototype = Node.prototype;

export default function Component() { throw FunctionNotImplemented('Component()'); }

function from(renderFn, name) {
  if( name == null ) {
    ({ name } = renderFn);
    if( !name ) throw InvalidArgValue({ renderFn }, 'should have a name');
  }

  function RenderFunction(...args) {
    if( !new.target ) return new RenderFunction(...args);

    if( typeof args[0] === 'string' ) {
      defineProperty(this, 'name', {
        enumerable: true,
        value: args.shift(),
      });
    }

    this.properties = Object(args.shift());
    this.children = args;
  }

  // Some properties are independent of render function, could be moved into
  // separate prototype. That may converse memory, but also increases latency
  // due to longer prototype chain, for a critical data structure nonetheless.

  const RenderFunctionPrototype = create(NodePrototype, {
    constructor: { value: RenderFunction },
    isProactComponent: { value: true },
    [toStringTag]: { value: 'Proact.Component' },
    render: { value: renderFn },

    name: { value: name, enumerable: true },
  });

  defineProperties(RenderFunction, {
    prototype: { value: RenderFunctionPrototype },
    isProactNodeFactory: { value: true },
    name: { value: name },
  });

  return RenderFunction;
}

defineProperties(Component, {
  prototype: { value: null }, // Nothing to see here for now.
  from: { value: from },
});
