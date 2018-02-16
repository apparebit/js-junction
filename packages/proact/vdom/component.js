/* (C) Copyright 2017–2018 Robert Grimm */

import { FunctionNotImplemented, InvalidArgType, InvalidArgValue } from '@grr/oddjob/errors';
import { constant, enumerable, value } from '@grr/oddjob/descriptors';
import Node from './node';
import driver from '../driver/hook';

const { apply } = Reflect;
const { create, defineProperties } = Object;
const { toStringTag } = Symbol;
const NodePrototype = Node.prototype;

export default function Component() { throw FunctionNotImplemented('Component()'); }

function provideContext(context) {
  driver().provideContext(this, context);
}

function from(renderFn, name = renderFn.name) {
  if( typeof renderFn !== 'function' ) {
    throw InvalidArgType({ renderFn }, 'a function');
  } else if( !name ) {
    throw InvalidArgValue({ name }, 'should not be empty');
  }

  function RenderFunction(...args) {
    if( !new.target ) return new RenderFunction(...args);

    // 1st argument may be constructor itself to (redundantly) capture identity.
    if( args[0] === RenderFunction ) args.shift();

    // Delegate processing of properties to Node.
    apply(Node, this, args);
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
