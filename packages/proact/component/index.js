/* (C) Copyright 2017 Robert Grimm */

import {
  InvalidArgType,
  MethodNotImplemented,
} from '@grr/oddjob/errors';

import isComponent from './is-component';

const { toStringTag } = Symbol;

const NAME = Symbol('name');

// -----------------------------------------------------------------------------

export const COMPONENT_TAG = 'Proact.Component';

export class ComponentBase {
  constructor(name) {
    this[NAME] = String(name);
  }

  get [toStringTag]() {
    return COMPONENT_TAG;
  }

  get name() {
    return this[NAME];
  }

  get context() {
    throw MethodNotImplemented('context');
  }

  style() {
    throw MethodNotImplemented('style()');
  }

  render() {
    throw MethodNotImplemented('render()');
  }
}

// -----------------------------------------------------------------------------

export class RenderFunction extends ComponentBase {
  constructor(renderFn, name = renderFn.name) {
    super(name);

    if( typeof renderFn !== 'function' ) {
      throw InvalidArgType({ renderFn }, 'a function');
    }
    this.render = renderFn;
  }
}

// -----------------------------------------------------------------------------

export function toComponent(value, name = null) {
  if( isComponent(value) ) {
    return value;
  } else if( typeof value === 'function' ) {
    return new RenderFunction(value, name || value.name);
  } else {
    throw InvalidArgType({ value }, 'a render function or component');
  }
}
