/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue } from '@grr/oddjob/errors';
import { constant } from '@grr/oddjob/descriptors';
import { normalize } from '../driver/children';

const { defineProperties, keys } = Object;
const { isArray } = Array;
const { toStringTag } = Symbol;

function isPropsObject(value) {
  return value != null
    && typeof value === 'object'
    && !value.isViewElement
    && !value.isViewComponent;
}

export default function Node(...args) {
  let [props] = args;

  if( props == null || isPropsObject(props) ) {
    this.properties = props = Object(args.shift());
  } else {
    this.properties = props = {};
  }

  if( 'context' in props ) {
    throw InvalidArgValue('properties', props, 'should not have a "context" property');
  } else if( 'children' in props ) {
    throw InvalidArgValue('properties', props, 'should not have a "children" property');
  }

  // Normalize the children (again), since it flattens nested arrays, removes
  // certain values (which mostly are falsy), and joins adjacent strings and
  // integers. Performing this normalization in the node constructor makes
  // ad-hoc inspection of a node's children and diffing of two nodes easier to
  // code since there are fewer cases to consider.
  this.children = normalize(args);
}

function format0(value) {
  if( isArray(value) ) {
    return `[${value.map(format0).join(', ')}]`;
  } else if( typeof value === 'string' ) {
    return `'${value}'`;
  } else {
    return String(value);
  }
}

function format(node = this) {
  let s = `${node[toStringTag]}('${node.name}'`;
  const props = node.properties;

  const names = keys(props);
  if( names.length === 0 ) {
    if( node.children.length === 0 ) return `${s})`;
    s += ', {}';
  } else {
    s += `, { ${names.map(n => `${n}: ${format0(props[n])}`).join(', ')} }`;
  }

  for( const child of node.children ) {
    if( typeof child === 'string' ) {
      s += `, '${child}'`;
    } else {
      s += `, ${String(child)}`;  // String() is necessary for symbols.
    }
  }

  s += ')';
  return s;
}

defineProperties(Node, {
  isPropsObject: constant(isPropsObject),
  format: constant(format),
});
