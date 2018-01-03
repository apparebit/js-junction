/* (C) Copyright 2017–2018 Robert Grimm */

import { isDocumentNodeTag } from '../semantics/tag';

const { isArray } = Array;
const { toStringTag } = Symbol;

export default function isDocumentNode(value) {
  if( value == null || typeof value !== 'object' ) {
    return false;
  } else if( isDocumentNodeTag(value[toStringTag]) ) {
    // The fast path checks for Proact's node tags and may be wrong.
    return true;
  } else {
    // The slow path checks for node properties and is more precise.
    return typeof value.name === 'string'
      && typeof value.attributes === 'object'
      && isArray(value.children)
      && typeof value.render === 'function';
  }
}
