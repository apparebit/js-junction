/* (C) Copyright 2017 Robert Grimm */

import {
  DuplicateBinding,
  InvalidArgValue,
} from '@grr/oddjob';

import { toComponent } from './index';
import typeElement from '../model/elements';

const registry = new Map();

export function define(renderer) {
  const component = toComponent(renderer);
  const { name } = component;

  // To support both ReactLike and html-like component naming, only normalize
  // name to lower case when checking for HTML tags.
  if( !name || typeElement(name.toLowerCase()) ) {
    throw InvalidArgValue('name', name);
  } else if( registry.has(name) ) {
    throw DuplicateBinding(name, registry.get(name), component);
  }

  registry.set(name, component);
}

export function lookup(name) {
  return registry.get(name);
}
