/* (C) Copyright 2017–2018 Robert Grimm */

import { isDocumentNodeTag } from '../semantics/tag';

const { isArray } = Array;
const { toStringTag } = Symbol;

export default function isDocumentNode(value) {
  if( value == null || typeof value !== 'object' ) {
    return false;
  } else if( isDocumentNodeTag(value[toStringTag]) ) {
    // Fast path checks for Proact's own nodes.
    return true;
  } else {
    // General path checks for core vDOM properties.
    return typeof value.name === 'string'
      && typeof value.attributes === 'object'
      && isArray(value.children)
      && typeof value.render === 'function';
  }
}
