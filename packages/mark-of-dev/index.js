/* (C) Copyright 2018 Robert Grimm */

/*
 * This module has no dependencies and its only visible effect is global. In
 * other words, it purposefully violates encapsulation and is written to be both
 * a CommonJS and an ECMAScript module.
 */

/* eslint-disable no-var, strict */
'use strict';

if( !('__DEV__' in global) ) {
  var dev = true;

  var label = (process.env.NODE_ENV || '').toLowerCase();
  if( label === 'prod' || label === 'production' ) {
    process.env.NODE_ENV = 'production';
    dev = false;
  }

  Object.defineProperty(global, '__DEV__', {
    configurable: false,
    enumerable: false,
    value: dev,
    writable: false
  });
}
