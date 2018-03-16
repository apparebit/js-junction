/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue } from '@grr/oddjob/errors';
import { constant, value } from '@grr/oddjob/descriptors';

const { create, defineProperties, keys } = Object;
const { toStringTag } = Symbol;

function isPropsObject(value) {
  return value != null
    && typeof value === 'object'
    && !value.isProactElement
    && !value.isProactComponent
    && !value.isProactNodeFactory;
}

export default function Node(...args) {
  let [props] = args;

  if( isPropsObject(props) ) {
    this.properties = args.shift();
  } else {
    this.properties = props = {};
  }

  if( 'context' in props ) {
    throw InvalidArgValue('properties', props, 'should not have a "context" property');
  } else if( 'children' in props ) {
    throw InvalidArgValue('properties', props, 'should not have a "children" property');
  }

  this.children = args;
}

const NodePrototype = create(null, {
  constructor: value(Node),

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

defineProperties(Node, {
  prototype: constant(NodePrototype),
  isPropsObject: constant(isPropsObject),
});
