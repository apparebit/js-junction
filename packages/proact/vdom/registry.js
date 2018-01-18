/* (C) Copyright 2017–2018 Robert Grimm */

import {
  DuplicateBinding,
  InvalidArgType,
  InvalidArgValue,
} from '@grr/oddjob/errors';

import { withKeyValue } from '@grr/oddjob/objects';
import { isHtmlElement } from '../semantics/elements';

const { toString } = Function.prototype;
const IS_CLASS = /^class /;

const registry = new Map();

export const define = withKeyValue(function define(name, factory) {
  // To support both ReactLike and html-like component naming, leave name as is.
  // However, isHTML() internally normalizes to lower case for correctness.
  if( !name || isHtmlElement(name) ) {
    throw InvalidArgValue({ name }, 'should be a non-empty, non-HTML name');
  } else if( typeof factory !== 'function' ) {
    throw InvalidArgType({ factory }, 'a factory function');
  } else if( IS_CLASS.test(toString.call(factory)) ) {
    throw InvalidArgType({ factory }, 'not', 'a class constructor, which requires "new")');
  } else if( registry.has(name) ) {
    throw DuplicateBinding(name, registry.get(name), factory);
  }

  registry.set(name, factory);
});

export function lookup(name) {
  return registry.get(name);
}
