/* (C) Copyright 2018 Robert Grimm */

import { InvalidArgType, InvalidArgValue } from '@grr/oddjob/errors';
import { normalizeWhitespace, escapeHTML, escapeScript } from '@grr/oddjob/strings';
import { hasRawText, isVoidElement } from '../semantics/elements';
import renderAttributes from './render-attributes';

// An effects handler for vDOM traversal that renders to HTML source.
export default function renderToHtml(tag, object) {
  if( tag === 'enter' ) {
    if( object.isViewComponent ) {
      const rendered = object.render(object.properties, object.children, this.context);

      // Since replaceChildren() does not accept `undefined` for its `children`
      // argument, call skipChildren() to cause exact same (lack of) behavior.
      if( rendered == null ) {
        this.skipChildren(object);
      } else {
        this.replaceChildren(object, rendered);
      }

      return '';
    } else {
      const { name, properties, children } = object;
      if( isVoidElement(name) && children.length ) {
        throw InvalidArgValue({ object }, `<${name}> is a void element`);
      }

      let rendered = '<';
      if( name === 'html' ) rendered += '!doctype html><';
      rendered += name;

      const attributes = [...renderAttributes(properties)];
      if( attributes.length ) rendered += ` ${attributes.join(' ')}`;
      return `${rendered}>`;
    }

  } else if( tag === 'exit' ) {
    if( object.isViewComponent ) return '';

    const { name } = object;
    return isVoidElement(name) ? '' : `</${name}>`;

  } else if( tag === 'text' ) {
    if( this.parent != null && hasRawText(this.parent.name) ) {
      if( this.parent.name !== 'script' ) {
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
