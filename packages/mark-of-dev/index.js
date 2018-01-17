/* (C) Copyright 2018 Robert Grimm */

/**
 * This module has no dependencies and its only potential effect is global,
 * i.e., purposefully violating encapsulation. As a direct result, this module
 * uses neither CommonJS' `require`/`module.exports` nor ECMAScript's
 * `import`/`export`. In fact, it may just be valid code for either module
 * system. To be safe, however, it still declares strict mode for use as
 * CommonJS code.
 */

// eslint-disable-next-line strict
'use strict';

const label = (process.env.NODE_ENV || '').toLowerCase();
if( label === 'prod' || label === 'production' ) {
  process.env.NODE_ENV = 'production';
} else if( !('__DEV__' in global) ) {
  Object.defineProperty(global, '__DEV__', { value: true });
}
