/* (C) Copyright 2017–2018 Robert Grimm */

import {
  DuplicateBinding,
  InvalidArgType,
  InvalidArgValue,
} from '@grr/oddjob/errors';

import { withKeyValue } from '@grr/oddjob/objects';
import { isHtmlElement } from '../semantics/elements';

const registry = new Map();

export const define = withKeyValue(function define(name, constructor) {
  // To support both ReactLike and html-like component naming, leave name as is.
  // However, isHTML() internally normalizes to lower case for correctness.
  if( !name || isHtmlElement(name) ) {
    throw InvalidArgValue({ name }, 'a non-empty, non-HTML name');
  } else if( typeof constructor !== 'function' ) {
    throw InvalidArgType({ constructor }, 'a constructor function');
  } else if( registry.has(name) ) {
    throw DuplicateBinding(name, registry.get(name), constructor);
  }

  registry.set(name, constructor);
});

export function lookup(name) {
  return registry.get(name);
}
