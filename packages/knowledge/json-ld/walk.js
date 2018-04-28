/* (C) Copyright 2018 Robert Grimm */

import { kindOf } from './kind';
import State from './state';

const { freeze, keys } = Object;
const { isArray } = Array;

export const noop = () => {};

export const VISITORS = freeze({
  __proto__: null,

  invalid: noop,
  primitive: noop,
  reference: noop,

  graph(value, state, dispatch) { dispatch(state, value, '@graph'); },
  list(value, state, dispatch) { dispatch(state, value, '@list'); },
  set(value, state, dispatch) { dispatch(state, value, '@set'); },
  value(value, state, dispatch) { dispatch(state, value, '@value'); },

  array(value, state, dispatch) {
    for( let index = 0; index < value.length; index++ ) {
      dispatch(state, value, index);
    }
  },

  node(value, state, dispatch) {
    for( const key of keys(value) ) {
      dispatch(state, value, key);
    }
  },

  reverse(value, state, dispatch) {
    if( value != null && typeof value === 'object' ) {
      for( const key of keys(value) ) {
        dispatch(state, value, key);
      }
    }
  }
});

/**
 * Walk the JSON-LD graph starting with `root`. If `handlers` includes an
 * `array`, `graph`, `invalid`, `list`, `node`, `primitive`, `reference`,
 * `reverse`, `set`, or `value` property, that property's value must be a
 * function and is invoked on every value of that kind and current state during
 * the traversal. In lieu of a suitable property, `fallback` serves as just
 * that. The state may be an arbitrary object, except that its `ancestors`
 * property is initialized to an empty array and used as a stack capturing
 * `kind`, `value`, `key`, and `parent` for each entity visited from the root to
 * and including the current entity. The `key` and `parent` are `null` for the
 * root and `value` is identical to `parent[key]` otherwise.
 */
export default function walk(root, {
  base = noop,
  handlers = {},
  skipped = null,
  state = new State(),
  visitors = VISITORS,
} = {}) {
  const dispatch = (state, parent, key, value = parent[key]) => {
    const kind = key === '@reverse' ? 'reverse' : kindOf(value);

    state.ancestors.push({ kind, value, key, parent });
    try {
      visitors[kind](value, state, dispatch);

      if( handlers[kind] ) {
        handlers[kind](value, state); // Invoke as method!
      } else {
        base(value, state);
      }
    } finally {
      state.ancestors.pop();
    }
  };

  // Ensure the ancestors property exists and is an array.
  if( !isArray(state.ancestors) ) state.ancestors = [];
  dispatch(state, null, skipped, root);
  return state;
}
