/* (C) Copyright 2017–2018 Robert Grimm */

import {
  InvalidArgType,
  MethodNotImplemented,
} from '@grr/oddjob/errors';

import { toSymbolKey } from '@grr/oddjob/strings';

import Tag from '../semantics/tag';

const { assign, create } = Object;
const { isArray } = Array;
const { toStringTag } = Symbol;

// -----------------------------------------------------------------------------
// Scaffolding: Prototype Creation

// Hook properties are configurable to allow for re-definition.
const HOOKS = {
  context: { // Access the site- and page-specific metadata.
    configurable: true,
    value() {
      throw MethodNotImplemented('context()');
    },
  },
  script: { // Emit the JavaScript fragment.
    configurable: true,
    value() {
      throw MethodNotImplemented('script()');
    }
  },
  style: { // Emit the CSS fragment.
    configurable: true,
    value() {
      throw MethodNotImplemented('style()');
    },
  },
};

// Instead of redefining hook method properties, use the properties argument as
// a clean way of overriding them.
export function createPrototype(renderFn, tag, properties = {}) {
  if( typeof renderFn !== 'function' ) {
    throw InvalidArgType({ renderFn }, 'a function');
  } else if( typeof tag !== 'string' || !tag ) {
    throw InvalidArgType({ tag }, 'a non-empty string');
  }

  return create(null, assign({
    render: {
      value: renderFn,
    },
    [toStringTag]: {
      value: tag,
    },
  }, HOOKS, properties));
}

// -----------------------------------------------------------------------------
// Scaffolding: Node Creation

function* justNonEmpty(list) {
  for( const el of list ) {
    if( isArray(el) ) {
      yield* justNonEmpty(el);
    } else if( el != null && el !== '' ) {
      yield el;
    }
  }
}

export function createNode(prototype, name, attributes, children) {
  return create(prototype, {
    name: {
      enumerable: true,
      value: String(name),
    },
    attributes: {
      enumerable: true,
      value: Object(attributes),
    },
    children: {
      enumerable: true,
      value: [...justNonEmpty(children)],
    }
  });
}

// -----------------------------------------------------------------------------
// Elements

export const ElementTag = toSymbolKey(Tag.Proact.Element);

function getThis() {
  return this;
}

export function createElementConstructor(properties = {}) {
  const ElementPrototype = createPrototype(getThis, ElementTag, properties);

  return function Element(name, attributes = {}, ...children) {
    return createNode(ElementPrototype, name, attributes, children);
  };
}

// -----------------------------------------------------------------------------
// Components

export const PureComponentTag = toSymbolKey(Tag.Proact.Component.Pure);

export function createPureComponentFactory(properties = {}) {
  return function PureComponent(renderFn, name = renderFn.name) {
    const PureComponentPrototype =
      createPrototype(renderFn, PureComponentTag, {
        ...properties,
        name: { value: name }
      });

    return function PureComponent(name, attributes = {}, ...children) {
      return createNode(PureComponentPrototype, name, attributes, children);
    };
  };
}
