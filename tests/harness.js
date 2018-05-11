/* (c) Copyright 2018 Robert Grimm */

import { basename, isAbsolute } from 'path';
import tap from 'tap';

const main = process.mainModule && process.mainModule.filename;

export default function test(path, callback) {
  const name = isAbsolute(path) ? `@grr/${basename(path, '.js')}` : path;

  // If caller is main module, run tests. Otherwise, return thunk.
  if( main === path ) {
    return tap.test(name, callback);
  } else {
    return () => tap.test(name, callback);
  }
}

export function load(id) {
  return import(id);
}
