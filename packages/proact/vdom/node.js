/* (C) Copyright 2017–2018 Robert Grimm */

const { create, defineProperty } = Object;
const { toStringTag } = Symbol;

// -------------------------------------------------------------------------------------------------

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
      value: children,
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
