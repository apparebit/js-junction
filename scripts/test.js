/* (c) Copyright 2017–2018 Robert Grimm */

import { load } from '../tests/harness';
import { muteWritable } from '@grr/oddjob/streams';
import { promisify } from 'util';
import { readdir as doReadDirectory } from 'fs';
import { resolve } from 'path';

const { keys: keysOf } = Object;
const readDirectory = promisify(doReadDirectory);
const tests = resolve(__dirname, '..', 'tests');

const debug = process.argv.includes('--debug');
const noTap = process.argv.includes('--no-tap');

let chalk; // Loaded dynamically, see beginning of run() below.

function traceRun(path) {
  if( debug ) {
    console.error(chalk.dim.blue(`# Run "${path}"`));
  }
}

function traceCoverage() {
  if( debug ) {
    const cover = global.__coverage__;
    if( cover ) {
      for( const key of keysOf(cover) ) {
        console.error(chalk.cyan(`# Covering "${key}"`));
      }
    }
  }
}

if( noTap ) muteWritable(process.stdout);

async function main() {
  // stdout is consumed by node-tap and therefore not a TTY stream.
  // Hence, we need to force color *before* loading chalk.
  process.env.FORCE_COLOR = '1';
  chalk = (await load('chalk')).default;

  const modules = (await readDirectory(tests))
    .filter(name => name.endsWith('.spec.js'));

  for( const name of modules ) {
    const path = resolve(tests, name);
    const module = await load(path);

    traceRun(path);
    await module.default();
    traceCoverage();
  }
}

main();
