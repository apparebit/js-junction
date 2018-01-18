/* (c) Copyright 2017–2018 Robert Grimm */

import fs from 'fs';
import util from 'util';
import { dynaload } from './harness';

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

const readdir = util.promisify(fs.readdir);
const SUFFIX = '.test.js';

(async function main() {
  const tests = (await readdir('tests'))
    .filter(s => s.length > SUFFIX.length && s.endsWith(SUFFIX));

  for( const test of tests ) {
    // eslint-disable-next-line no-await-in-loop
    await dynaload(`./${test.slice(0, -3)}`);
  }
})();
