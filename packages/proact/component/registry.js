/* (C) Copyright 2017 Robert Grimm */

import {
  DuplicateBinding,
  InvalidArgValue,
} from '@grr/oddjob/errors';

import { toComponent } from './index';
import { isHtmlTag } from '@grr/proact-semantics/elements';

const registry = new Map();

export function define(renderer) {
  const component = toComponent(renderer);
  const { name } = component;

  // To support both ReactLike and html-like component naming, leave name as is.
  // However, isHTML() internally normalizes to lower case for correctness.
  if( !name || isHtmlTag(name) ) {
    throw InvalidArgValue({ name });
  } else if( registry.has(name) ) {
    throw DuplicateBinding(name, registry.get(name), component);
  }

  registry.set(name, component);
}

export function lookup(name) {
  return registry.get(name);
}
