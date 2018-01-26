/* (C) Copyright 2017–2018 Robert Grimm */

import Node from './node';

const { create, defineProperties } = Object;
const { toStringTag } = Symbol;

export default function Element(name, attributes, ...children) {
  if( !new.target ) return new Element(name, attributes, ...children);
  this.name = String(name);
  this.attributes = Object(attributes);
  this.children = children;
}

const ElementPrototype = create(Node.prototype, {
  constructor: { value: Element },
  isProactElement: { value: true },
  [toStringTag]: { value: 'Proact.Element' },
});

defineProperties(Element, {
  prototype: { value: ElementPrototype },
  isProactNodeFactory: { value: true },
});
