/* (c) Copyright 2017–2018 Robert Grimm */

import { promisify } from 'util';
import { readdir as doReaddir } from 'fs';
import { resolve } from 'path';
import { default as harness, testdir } from './harness';

const { debugPort, execArgv } = process;
const readdir = promisify(doReaddir);
const NODE_BINARY = process.execPath;
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

const DEBUG_OPTION = /^(--inspect|--inspect-brk)(?:=(\d+))?$/u;

function createExecArgvFactory(argv) {
  let flag, port;
  const rest = [];

  for( const arg of argv ) {
    const match = arg.match(DEBUG_OPTION);

    if( match == null ) {
      rest.push(arg);
    } else {
      flag = match[1]; // eslint-disable-line prefer-destructuring
      port = match[2] ? Number(match[2]) : debugPort;
    }
  }

  if( !flag || !port ) {
    return () => [...rest];
  } else {
    let delta = 1;
    return () => [...rest, `${flag}=${port + (delta++)}`];
  }
}

const rightArgv = createExecArgvFactory(execArgv);

(async function run() {
  await Promise.all(
    (await readdir(testdir))
      .filter(name => name.endsWith(TEST_SUFFIX))
      .map(testfile => harness.spawn(NODE_BINARY,
        [...rightArgv(), resolve(testdir, testfile)])));
})();
