/* (C) Copyright 2017–2018 Robert Grimm */

const { create, defineProperty, freeze } = Object;
const { isArray } = Array;
const { toStringTag } = Symbol;

// -------------------------------------------------------------------------------------------------

function* flattenNonNullElementsOf(list) {
  for( const el of list ) {
    if( isArray(el) ) {
      yield* flattenNonNullElementsOf(el);
    } else if( el != null && el !== '' && typeof el !== 'boolean' ) {
      yield el;
    }
  }
}

export default function Node(prototype, name, attributes, ...children) {
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
      value: freeze([...flattenNonNullElementsOf(children)]),
    }
  });
}

// -------------------------------------------------------------------------------------------------
// All elements and all components share one prototype each. The two prototypes,
// in turn, share this prototype, which is quite sparse but also provides a
// well-defined extension point for implementing new features.

const NodePrototype = create(null, {
  isProactNode: { value: true },

  // eslint-disable-next-line func-name-matching
  toString: { value: function toString() {
    return `${this[toStringTag]}(${this.name})`;
  }},
});

defineProperty(Node, 'prototype', {
  value: NodePrototype,
});
