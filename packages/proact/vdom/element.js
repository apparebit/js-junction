/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgType, MissingArgs } from '@grr/err';
import Node from './node';

const { apply } = Reflect;
const configurable = true;
const { create, defineProperty } = Object;
const { toStringTag } = Symbol;

export default function Element(...args) {
  if (!new.target) return new Element(...args);

  // 1st argument must be the element name.
  if (args.length === 0) {
    throw MissingArgs('name');
  } else if (typeof args[0] !== 'string') {
    throw InvalidArgType('name', args[0], 'a string');
  }
  this.name = args.shift();

  // Delegate processing of properties to Node.
  apply(Node, this, args);
}

const ElementPrototype = create(Node.prototype, {
  constructor: { configurable, value: Element },
  isViewElement: { configurable, value: true }, // Flag to detect view element type.
  [toStringTag]: { configurable, value: 'Proact.Element' },
});

defineProperty(Element, 'prototype', { value: ElementPrototype });
