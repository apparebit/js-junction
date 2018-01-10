/* (C) Copyright 2018 Robert Grimm */

import {
  InvalidArgType,
  InvalidArgValue,
} from '@grr/oddjob/errors';

import { isVoidElement } from '../semantics/elements';
import renderAttributes from './render-attributes';
import createContext from './context';

const { isArray } = Array;
const SAFE_TEXT = Symbol('safe-text');

// -------------------------------------------------------------------------------------------------

/** Render the vDOM element into the context. */
function renderElement(element, context) {
  const { name, attributes, children } = element;

  const renderedAttributes = [...renderAttributes(attributes)];
  if( renderedAttributes.length ) {
    context.write(`<${name} ${renderedAttributes.join(' ')}>`);
  } else {
    context.write(`<${name}>`);
  }

  if( isVoidElement(name) ) {
    if( children.length ) throw InvalidArgValue('element', element, `<${name}> is a void element`);
    return context;
  }

  // Push the closing tag onto the stack of work items followed by this
  // element‘s children. This preserves the nesting of HTML elements within each
  // other, and it clearly marks safe strings as such.
  context.pushItem({ [SAFE_TEXT]: `</${name}>` });
  if( !context.isShallowRender ) context.pushItem(...children);
  return context;
}

/** Render any values queued up in the context. */
function runRenderLoop(context) {
  while( context.hasItem() ) {
    let value = context.popItem();

    // Render down to a non-component value and then render that value.
    while( value != null && value.isProactComponent ) {
      value = value.render(value.name, value.attributes, value.children);
    }

    const type = typeof value;
    if( value == null || value === '' || type === 'boolean' ) {
      // Nothing to do. Ignore boolean values because quick 'n' easy boolean
      // expressions in templates may result in superfluous `false` values.
    } else if( type === 'number' || type === 'string' ) {
      context.write(String(value));
    } else if( type === 'object' && SAFE_TEXT in value ) {
      context.write(value[SAFE_TEXT]);
    } else if( isArray(value) ) {
      context.pushItem(...value);
    } else if( value.isProactElement ) {
      renderElement(value, context);
    } else {
      throw InvalidArgType({ value }, 'a Proact vDOM node, an array, or a string');
    }
  }

  return context;
}

/**
 * Render the value to standard-issue HTML, CSS, and JavaScript.
 *
 * The `context` threads what otherwise would be global state through the
 * rendering process. It maintains the stack of values that still need to be
 * rendered, with the `pushWork()`, `hasWork()`, and `popWork()` operations. It
 * also maintains the list of already generated text fragments, with the
 * `write()` and `toString() operations. The latter, however, is not invoked by
 * this module.
 */
export default function render(value, context = createContext()) {
  return runRenderLoop(context.pushItem(value));
}
