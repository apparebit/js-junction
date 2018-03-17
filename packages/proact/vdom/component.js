/* (C) Copyright 2017–2018 Robert Grimm */

import { FunctionNotImplemented, InvalidArgType, InvalidArgValue } from '@grr/oddjob/errors';
import { constant, enumerable, value } from '@grr/oddjob/descriptors';
import Node from './node';
import driver from '../driver/hook';

const { apply } = Reflect;
const { create, defineProperties } = Object;
const { format } = Node;
const { toStringTag } = Symbol;
const NodePrototype = Node.prototype;

export default function Component() { throw FunctionNotImplemented('Component()'); }

function provideContext(context) {
  driver().provideContext(this, context);
}

/**
 * Create a functional component with the given render function and name. For
 * named functions, the name may be omitted to avoid repetition. The name may
 * also be specified before the render function to accommodate arrow functions
 * while also optimizing for readability.
 */
function from(renderFn, name = renderFn.name) {
  if( typeof name === 'function' ) {
    [renderFn, name] = [name, renderFn];
  } else if( typeof renderFn !== 'function' ) {
    throw InvalidArgType({ renderFn }, 'a function');
  }

  name = String(name);
  if( !name ) {
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
    toString: value(format),
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
