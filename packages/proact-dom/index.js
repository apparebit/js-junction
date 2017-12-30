/* (C) Copyright 2017 Robert Grimm */

import { InvalidArgType } from '@grr/oddjob/errors';
import isComponent from './component/is-component';

const { isArray } = Array;
const { toStringTag } = Symbol;

const ATTRIBUTES = Symbol('attributes');
const CHILDREN = Symbol('children');
const COMPONENT = Symbol('component');
const NAME = Symbol('name');

// -----------------------------------------------------------------------------

export const ELEMENT_TAG = 'Proact.Element';

export class ElementBase {
  constructor(name, attributes = {}, ...children) {
    while( children.length === 1 && isArray(children[0]) ) {
      [children] = children;
    }

    this[NAME] = String(name);
    this[ATTRIBUTES] = Object(attributes);
    this[CHILDREN] = children;
  }

  get [toStringTag]() {
    return ELEMENT_TAG;
  }

  get name() {
    return this[NAME];
  }

  get attributes() {
    return this[ATTRIBUTES];
  }

  get children() {
    return this[CHILDREN];
  }

  get component() {
    return this[COMPONENT];
  }

  isCustom() {
    return this[COMPONENT] != null;
  }
}

// -----------------------------------------------------------------------------

export class StandardElement extends ElementBase {
  constructor(name, attributes = {}, ...children) {
    super(name, attributes, ...children);
  }
}

// -----------------------------------------------------------------------------

export class CustomElement extends ElementBase {
  constructor(component, attributes = {}, ...children) {
    super(component.name, attributes, ...children);

    if( !isComponent(component) ) {
      throw InvalidArgType({ component }, 'a Proact component');
    }
    this[COMPONENT] = component;
  }
}
