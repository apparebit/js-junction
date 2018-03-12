/* (c) Copyright 2017–2018 Robert Grimm */

import { promisify } from 'util';
import { readdir as doReaddir } from 'fs';
import { resolve } from 'path';
import { dynaload, testdir } from './harness';

const readdir = promisify(doReaddir);
const TEST_SUFFIX = '.test.js';

function hasQuietFlag() {
  for( const arg of process.argv ) {
    if( arg === '--' ) return false;
    if( arg === '--quiet' ) return true;
  }
  return false;
}

if( hasQuietFlag() ) {
  // Disable standard output by overriding write(). This suppresses the raw TAP
  // output to the console when collecting code coverage data outside node-tap.
  process.stdout.write = function write(chunk, encoding, callback) {
    if( typeof encoding === 'function' ) {
      process.nextTick(encoding);
    } else if( typeof callback === 'function' ) {
      process.nextTick(callback);
    }
    return true;
  };
}

(async function run() {
  await Promise.all(
    (await readdir(testdir))
      .filter(name => name.endsWith(TEST_SUFFIX))
      .map(name => dynaload(resolve(testdir, name))));
})();
