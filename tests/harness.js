/* (c) Copyright 2018 Robert Grimm */

import { basename, isAbsolute } from 'path';
import tap from 'tap';
import { resolve } from 'uri-js';

const main = process.mainModule && process.mainModule.filename;
const MARK_OF_DEV = resolve(__dirname, '..', 'packages', 'mark-of-dev');

export default function test(path, callback) {
  const name = !isAbsolute(path)
    ? path
    : path === MARK_OF_DEV
      ? 'mark-of-dev'
      : `@grr/${basename(path, '.js')}`;

  // If caller is main module, run tests. Otherwise, return thunk.
  if (main === path) {
    return tap.test(name, callback);
  } else {
    return () => tap.test(name, callback);
  }
}

export function load(id) {
  return import(id);
}
