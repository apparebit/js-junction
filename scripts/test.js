/* (c) Copyright 2017–2018 Robert Grimm */

import { load } from '../tests/harness';
import { promisify } from 'util';
import { readdir as doReadDirectory } from 'fs';
import { resolve } from 'path';
import { muteWritable } from '../packages/oddjob/streams';

const { keys: keysOf } = Object;
const readDirectory = promisify(doReadDirectory);
const tests = resolve(__dirname, '..', 'tests');

const debug = process.argv.includes('--debug');
const noTap = process.argv.includes('--no-tap');

let chalk; // Loaded dynamically, see beginning of run() below.

function traceRun(path) {
  if( debug ) {
    console.error(chalk.gray(`# Run "${path}"`));
  }
}

function traceCoverage() {
  if( debug ) {
    const cover = global.__coverage__;
    if( cover ) {
      for( const key of keysOf(cover) ) {
        console.error(chalk.magenta(`# Cover "${key}"`));
      }
    }
  }
}

if( noTap ) muteWritable(process.stdout);

async function run() {
  // stdout is consumed by node-tap and therefore not a TTY stream.
  // Hence, we need to force color *before* loading chalk.
  process.env.FORCE_COLOR = '1';
  chalk = (await load('chalk')).default;

  const modules = (await readDirectory(tests))
    .filter(name => name[0] !== '.' && name !== 'harness.js');

  for( const name of modules ) {
    const path = resolve(tests, name);
    const module = await load(path);

    traceRun(path);
    await module.default();
    traceCoverage();
  }
}

run();
