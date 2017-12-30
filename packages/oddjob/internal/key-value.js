/* (C) Copyright 2017 Robert Grimm */

import { InvalidArgValue } from './errors';
import { default as isObject } from './is-object';

const {
  getOwnPropertyNames,
  getOwnPropertySymbols,
} = Object;

const { isArray } = Array;

const KEY_TYPES = new Set(['number', 'string', 'symbol']);

export function isPropertyKey(value) {
  return KEY_TYPES.has(typeof value);
}

export function getOwnPropertyKeys(object) {
  return [
    ...getOwnPropertyNames(object),
    ...getOwnPropertySymbols(object)
  ];
}

/**
 * Convert the object to a `[key, value]` pair. The argument must, in fact, be
 * an object.
 */
export function toKeyValue(object) {
  if( isArray(object) ) {
    if( object.length === 2 && isPropertyKey(object[0]) ) {
      return object;
    }
  } else {
    const keys = getOwnPropertyKeys(object);

    if( keys.length === 1 ) {
      const [key] = keys;
      return [key, object[key]];
    } else if(
      keys.length === 2
      && keys.includes('key')
      && keys.includes('value')
    ) {
      return [object.key, object.value];
    }
  }

  throw InvalidArgValue(
    'object', object, 'an object representing a single key-value pair');
}

export function withKeyValue(original, ...indices) {
  if( !indices.length ) indices = [0];

  return new Proxy(original, { apply(target, that, args) {
    for( const index of indices ) {
      const arg = args[index];

      if( isObject(arg) ) {
        const [key, value] = toKeyValue(arg);
        args[index] = key;
        args.splice(index + 1, 0, value);
      }
    }

    return Reflect.apply(target, that, args);
  }});
}
