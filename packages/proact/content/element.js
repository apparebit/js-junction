/* (C) Copyright 2017–2018 Robert Grimm */

import Node from './node';

const { create, defineProperties } = Object;
const NodePrototype = Node.prototype;
const { toStringTag } = Symbol;

export default function Element(name, attributes, ...children) {
  // eslint-disable-next-line no-use-before-define
  return Node(ElementPrototype, name, attributes, children);
}

const ElementTag = 'Proact.Element';
const ElementPrototype = create(NodePrototype, {
  constructor: { value: Element },
  isProactElement: { value: true },
  [toStringTag]: { value: ElementTag },
});

defineProperties(Element, {
  tag: { value: ElementTag },
  prototype: { value: ElementPrototype },
});
