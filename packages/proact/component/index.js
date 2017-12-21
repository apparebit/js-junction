/* (C) Copyright 2017 Robert Grimm */

import {
  InvalidArgType,
  MethodNotImplemented,
  toSymbolKey,
} from '@grr/oddjob';

import tag from '../util/tag';

const { toStringTag } = Symbol;

// -----------------------------------------------------------------------------

const NAME = Symbol('NAME');

export class ComponentBase {
  constructor(name) {
    this[NAME] = name;
  }

  get [toStringTag]() {
    throw MethodNotImplemented('toStringTag');
  }

  get name() {
    return this[NAME];
  }

  render() {
    throw MethodNotImplemented('render');
  }
}

// -----------------------------------------------------------------------------

const RENDER_FUNCTION_TAG = toSymbolKey(tag.Proact.Component.Functional);

export class RenderFunction extends ComponentBase {
  constructor(renderer, name = renderer.name) {
    super(name);
    this.render = renderer;
  }

  get [toStringTag]() {
    return RENDER_FUNCTION_TAG;
  }
}

// -----------------------------------------------------------------------------

export function isComponent(value) {
  return value != null && typeof value.render === 'function';
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
