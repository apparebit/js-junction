/* (C) Copyright 2018 Robert Grimm */

import { InvalidArgType, InvalidArgValue } from '@grr/oddjob/errors';
import { normalizeWhitespace, escapeHTML, escapeScript } from '@grr/oddjob/strings';
import { hasRawText, isVoidElement } from '../semantics/elements';
import renderAttributes from './render-attributes';

// An effects handler for vDOM traversal that renders to HTML source.
export default function render(tag, object, parent, aside) {
  if( tag === 'enter' ) {
    if( object.isProactComponent ) {
      const rendered = object.render(object.name, object.attributes, object.children);
      aside.replaceChildren(rendered);
      return '';
    }

    const { name, attributes, children } = object;
    if( isVoidElement(name) && children.length ) {
      throw InvalidArgValue({ object }, `<${name}> is a void element`);
    }

    const renderedAttributes = [...renderAttributes(attributes)];
    if( renderedAttributes.length ) {
      return `<${name} ${renderedAttributes.join(' ')}>`;
    } else {
      return `<${name}>`;
    }

  } else if( tag === 'exit' ) {
    if( object.isProactComponent ) return '';

    const { name } = object;
    return isVoidElement(name) ? '' : `</${name}>`;

  } else if( tag === 'text' ) {
    if( parent != null && hasRawText(parent.name) ) {
      if( parent.name !== 'script' ) {
        return object;
      } else {
        return escapeScript(object);
      }
    } else {
      return escapeHTML(normalizeWhitespace(object));
    }

  } else if( tag === 'unknown' ) {
    throw InvalidArgType({ object }, 'text, a Proact node, or an array thereof');
  } else {
    throw InvalidArgValue({ tag }, 'should be "text", "enter", "exit", or "unknown"');
  }
}
