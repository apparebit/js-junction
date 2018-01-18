/* (C) Copyright 2018 Robert Grimm */

import { StringRenderer } from '../driver';

import {
  InvalidArgType,
  InvalidArgValue,
} from '@grr/oddjob/errors';

import { hasRawText, isVoidElement } from '../semantics/elements';
import renderAttributes from './render-attributes';

const { keys } = Object;

const WHITESPACE = /[\t\n\f\r ]+/g;
const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};
const ESCAPABLE = new RegExp(`[${keys(ESCAPES).join('')}]`, 'g');

export function renderFragment(tag, object, parent) {
  if( tag === 'enter' && object.isProactComponent ) {
    do {
      object = object.render(object.name, object.attributes, object.children);
    } while( object != null && object.isProactComponent );

    // The result of rendering the component replaces the component.
    return { value: object };
  }

  if( tag === 'enter' ) {
    const { name, attributes, children } = object;

    const renderedAttributes = [...renderAttributes(attributes)];
    if( renderedAttributes.length ) {
      this.write(`<${name} ${renderedAttributes.join(' ')}>`);
    } else {
      this.write(`<${name}>`);
    }

    if( isVoidElement(name) && children.length ) {
      throw InvalidArgValue({ object }, `<${name}> is a void element`);
    }

  } else if( tag === 'exit' ) {
    const { name } = object;
    if( !isVoidElement(name) ) this.write(`</${name}>`);

  } else if( tag === 'text' ) {
    if( parent != null && hasRawText(parent.name) ) {
      this.write(object);
      // TODO: '<!--' => '<\!--', '<script' => '<\script', '</script' => '<\/script'
    } else {
      this.write(object.replace(ESCAPABLE, c => ESCAPES[c]).replace(WHITESPACE, ' '));
    }

  } else {
    throw InvalidArgType({ object }, 'a Proact node, text, or an array thereof');
  }

  return null;
}

const defaultRenderDriver = new StringRenderer(renderFragment);

export default function render(value, driver = defaultRenderDriver) {
  return driver.reset(value).traverse().toString();
}
