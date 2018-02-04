/* (C) Copyright 2017–2018 Robert Grimm */

import { FunctionNotImplemented } from '@grr/oddjob/errors';
import { constant, value } from '@grr/oddjob/descriptors';

const { create, defineProperty, keys } = Object;
const { toStringTag } = Symbol;

export default function Node() { throw FunctionNotImplemented('Node()'); }

const NodePrototype = create(null, {
  constructor: value(Node),
  isProactNode: value(true),

  toString: value(function toString() {
    let s = `${this[toStringTag]}(${this.name}`;

    const source = this.properties;
    const sink = [];

    for( const key of keys(source) ) {
      const value = source[key];
      sink.push( `${key}=${value}`);
    }

    if( sink.length ) s += `, ${sink.join(', ')}`;

    s += ')';
    return s;
  }),

});

defineProperty(Node, 'prototype', constant(NodePrototype));
