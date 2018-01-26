/* (C) Copyright 2017–2018 Robert Grimm */

import Node from './node';

const { create, defineProperties } = Object;
const { toStringTag } = Symbol;

export default function Element(name, properties, ...children) {
  if( !new.target ) return new Element(name, properties, ...children);
  this.name = String(name);
  this.properties = Object(properties);
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
