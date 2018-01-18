/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue, MethodNotImplemented } from '@grr/oddjob/errors';
import Node from './node';

const { create, defineProperties, defineProperty } = Object;
const { toStringTag } = Symbol;

// -------------------------------------------------------------------------------------------------

export default function Component() { throw MethodNotImplemented('Component()'); }

function from(renderFn, typeName) {
  if( typeName == null ) {
    typeName = renderFn.name;
    if( !typeName ) throw InvalidArgValue({ renderFn }, 'should have a name');
  }

  function RenderFunction(name, attributes, ...children) {
    if( !name ) name = typeName;
    // eslint-disable-next-line no-use-before-define
    return Node(RenderFunctionPrototype, name, attributes, ...children);
  }

  // eslint-disable-next-line no-use-before-define
  const RenderFunctionPrototype = create(ComponentPrototype, {
    constructor: { value: RenderFunction },
    render: { value: renderFn },
    name: { value: typeName },
  });

  defineProperty(RenderFunction, 'prototype', { value: RenderFunctionPrototype });
  return RenderFunction;
}

// -------------------------------------------------------------------------------------------------

const ComponentTag = 'Proact.Component';
const ComponentPrototype = create(Node.prototype, {
  // ------------------------------------------------------------- Invariant Properties
  isProactComponent: { value: true },
  [toStringTag]: { value: ComponentTag },

  // ----------------------------------------------------------------- Abstract Methods
  render: { value() { throw MethodNotImplemented('render()'); } },

  // ----------------------------------------------------------------- Extension Points
  metadata: { // Retrieve content metadata.
    configurable: true,
    value() { throw MethodNotImplemented('metadata()'); },
  },
  script: { // Emit the JavaScript fragment.
    configurable: true,
    value() { throw MethodNotImplemented('script()'); },
  },
  style: { // Emit the CSS fragment.
    configurable: true,
    value() { throw MethodNotImplemented('style()'); },
  },
});

defineProperties(Component, {
  tag: { value: ComponentTag },
  prototype: { value: ComponentPrototype },
  from: { value: from },
});
