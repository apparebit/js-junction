/* (C) Copyright 2018 Robert Grimm */

import { isIterable } from '@grr/sequitur/types';

const { isArray } = Array;
const { isNaN } = Number;

export function isIgnorable(value) {
  return value == null || value === false || value === true || isNaN(value) || value === '';
}

export function isTextual(value) {
  const type = typeof value;
  return type === 'number' && !isNaN(value) || type === 'string' && value !== '';
}

export function pushAll(todo, items) {
  if( !isArray(items) ) items = [...items];

  for( let index = items.length - 1; index >= 0; index-- ) {
    todo.push(items[index]);
  }

  return todo;
}

/**
 * Return the next normalized child value. Given a stack of items to process,
 * i.e., a node's reversed array of children, this function returns the next
 * value. It skips `undefined`, `null`, `false`, `true`, `NaN`, and `''`. It
 * also flattens non-string iterables. Finally, it combines subsequent string
 * values, even when interspersed with skipped values or across nested
 * iterables. The resulting string values are maximal, i.e., the next value
 * returned by this function is guaranteed not to be a string. It there are no
 * more values to return, this function returns `null`. Note that this function
 * modifies the argument, popping values and pushing the elements of iterables.
 */
export function next(todo) {
  while( todo.length >  0 ) {
    const value = todo.pop();

    if( isIgnorable(value) ) {
      continue;
    } else if( isTextual(value) ) {
      let text = String(value);

      while( todo.length > 0 ) {
        const top = todo[todo.length - 1];

        if( isIgnorable(top) ) {
          todo.pop();
        } else if( isTextual(top) ) {
          text += todo.pop();
        } else if( isIterable(top) ) {
          pushAll(todo, todo.pop());
        } else {
          break;
        }
      }

      return text;
    } else if( isIterable(value) ) {
      pushAll(todo, value);
    } else {
      return value;
    }
  }

  return null;
}

/**
 * Normalize the children. This function repeatedly calls `next()` to build a
 * normalized array of children. Comparable to `next()`, it also modifies the
 * argument — to the point of it becoming an empty array.
 */
export function normalize(children) {
  children.reverse();
  const normalized = [];

  let child = next(children);
  while( child != null ) {
    normalized.push(child);
    child = next(children);
  }

  return normalized;
}
