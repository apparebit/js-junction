/* (C) Copyright 2017–2018 Robert Grimm */

import { InvalidArgValue } from '@grr/oddjob/errors';
import { constant, value } from '@grr/oddjob/descriptors';
import Node from './node';

const { create, defineProperties } = Object;
const { toStringTag } = Symbol;

export default function Element(name, properties, ...children) {
  if( !new.target ) return new Element(name, properties, ...children);
  this.name = String(name);
  this.properties = Object(properties);
  if( 'children' in this.properties ) {
    throw InvalidArgValue('properties', this.properties, 'should not have a children property');
  }
  this.children = children;
}

const ElementPrototype = create(Node.prototype, {
  constructor: value(Element),
  isProactElement: value(true),
  [toStringTag]: value('Proact.Element'),
});

defineProperties(Element, {
  prototype: constant(ElementPrototype),
  isProactNodeFactory: value(true),
});
