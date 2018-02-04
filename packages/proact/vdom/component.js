/* (C) Copyright 2017–2018 Robert Grimm */

import { FunctionNotImplemented, InvalidArgType, InvalidArgValue } from '@grr/oddjob/errors';
import { constant, enumerable, value } from '@grr/oddjob/descriptors';
import Node from './node';

const { create, defineProperties, defineProperty } = Object;
const { toStringTag } = Symbol;
const NodePrototype = Node.prototype;

export default function Component() { throw FunctionNotImplemented('Component()'); }

function from(renderFn, name = renderFn.name) {
  if( typeof renderFn !== 'function' ) {
    throw InvalidArgType({ renderFn }, 'a function');
  } else if( !name ) {
    throw InvalidArgValue({ name }, 'should not be empty');
  }

  function RenderFunction(...args) {
    if( !new.target ) return new RenderFunction(...args);

    if( typeof args[0] === 'string' ) {
      defineProperty(this, 'name', value(args.shift(), { enumerable }));
    }
    this.properties = Object(args.shift());
    if( 'children' in this.properties ) {
      throw InvalidArgValue('properties', this.properties, 'should not have a children property');
    }
    this.children = args;
  }

  // The isProactComponent, toStringTag, and provideContext properties are the
  // same for all render function components and could thus be moved into a
  // shared prototype. While that may reduce memory pressure, it also increases
  // the length of the prototype chain and thus property lookup latency.

  const RenderFunctionPrototype = create(NodePrototype, {
    constructor: value(RenderFunction),
    isProactComponent: value(true),
    [toStringTag]: value('Proact.Component'),
    name: value(name, { enumerable }),
    render: value(renderFn),
    provideContext: value(provideContext),
  });

  defineProperties(RenderFunction, {
    prototype: constant(RenderFunctionPrototype),
    isProactNodeFactory: value(true),
    name: value(name),
  });

  return RenderFunction;
}

defineProperties(Component, {
  prototype: constant(null), // Nothing to see here for now.
  from: value(from),
});
