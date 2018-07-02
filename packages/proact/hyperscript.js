/* (C) Copyright 2018 Robert Grimm */

import { InvalidArgValue } from '@grr/err';
import Element from './vdom/element';

const { has, get, set } = Reflect;

/*
 * Unlike the original `hyperscript` package, Proact's node factory `h()` does
 * not support ID and class selectors as part of the first argument:
 *
 *  1. ID and class attributes can already be specified as props. Having two
 *     ways of doing so just requires more code for combining the results.
 *  2. Proact does support element factories specialized by tag name, but they
 *     omit the first argument (by definition) and thus cannot benefit from the
 *     selector notation either.
 *
 * In short, hyperscript's ID and class selector notation is too limited in use
 * and too complex in implementation.
 */
function h(type, ...args) {
  const kind = typeof type;
  if (kind === 'string') {
    return Element(type, ...args);
  } else if (kind === 'function') {
    return type(...args);
  } else {
    throw InvalidArgValue(
      { type },
      'should be an element name or component constructor'
    );
  }
}

export default new Proxy(h, {
  get(target, key, receiver) {
    if (has(target, key)) {
      return get(target, key, receiver);
    } else {
      const factory = function factory(...args) {
        return Element(key, ...args);
      };

      set(target, key, factory);
      return factory;
    }
  },
});
