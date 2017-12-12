/* (C) Copyright 2017 Robert Grimm */

import { InvalidArgType } from './errors';
import { isObject } from './types';

const { create } = Object;
const { hasOwnProperty } = Object.prototype;
const { isArray } = Array;

export function toPath(path) {
  const type = typeof path;

  if( path == null ) {
    return [];
  } else if( type === 'string' ) {
    return path ? path.split('.') : [];
  } else if( type === 'number' ) {
    return [String(path)];
  } else if( type === 'symbol' ) {
    return [path];
  } else if( isArray(path) ) {
    return path;
  } else {
    throw InvalidArgType('path', path, 'a string, symbol, or array');
  }
}

function doWithPath(existingOnly, root, path, task) {
  if( !isObject(root) ) throw InvalidArgType('root', root, 'an object');

  const keys = toPath(path);
  const { length } = keys;

  let enclosing = root;
  for( let index = 0; index < length - 1; index++ ) {
    const key = keys[index];

    if( !hasOwnProperty.call(enclosing, key) ) {
      if( existingOnly ) return void 0;
      enclosing = enclosing[key] = create(null);
    } else {
      enclosing = enclosing[key];

      if( !isObject(enclosing) ) {
        throw InvalidArgType(`root.${keys.slice(0, index + 1).join('.')}`,
          enclosing, 'an object');
      }
    }
  }

  const key = keys[length - 1];
  if( existingOnly && !hasOwnProperty.call(enclosing, key) ) {
    return void 0;
  }

  const state = [enclosing, key, enclosing[key]];
  return task ? task.apply(enclosing, state) : state;
}

export const withPath =
  (root, path, task) => doWithPath(false, root, path, task);
export const withExistingPath =
  (root, path, task) => doWithPath(true, root, path, task);
