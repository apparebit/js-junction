/* (C) Copyright 2017–2018 Robert Grimm */

import { FunctionNotImplemented } from '@grr/oddjob/errors';
import renderAttributes from '../html/render-attributes';

const { create, defineProperty } = Object;
const { toStringTag } = Symbol;

export default function Node() { throw FunctionNotImplemented('Node()'); }

const NodePrototype = create(null, {
  constructor: { value: Node },
  isProactNode: { value: true },

  toString: {
    value: function toString() { // eslint-disable-line func-name-matching
      // Kind and name.
      let s = `${this[toStringTag]}(${this.name}`;

      // Properties, attributes, whatever
      const atts = [...renderAttributes(this.attributes)].join(', ');
      if( atts ) s += `, ${atts}`;

      // Et voila!
      s += ')';
      return s;
    }
  },
});

defineProperty(Node, 'prototype', { value: NodePrototype });
