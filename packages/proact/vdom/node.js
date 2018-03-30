/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue } from '@grr/oddjob/errors';
import { constant } from '@grr/oddjob/descriptors';
import { normalize } from '../driver/children';

const { defineProperty } = Object;

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

defineProperty(Node, 'isPropsObject', constant(isPropsObject));
