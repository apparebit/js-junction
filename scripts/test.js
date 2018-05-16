/* (c) Copyright 2017–2018 Robert Grimm */

import { load } from '../tests/harness';
import { muteWritable } from '@grr/oddjob/streams';
import parseArguments from 'mri';
import { promisify } from 'util';
import { readdir as doReadDirectory } from 'fs';
import { resolve } from 'path';

const { keys: keysOf } = Object;
const readDirectory = promisify(doReadDirectory);
const tests = resolve(__dirname, '..', 'tests');

const args = parseArguments(process.argv.slice(2), {
  default: { trace: false, tap: true },
});

(async function main() {
  // If node-tap found stdout to be colorful, force chalk to be colorful too.
  if( process.env.TAP_COLORS === '1' ) process.env.FORCE_COLOR = '1';
  const highlight = (await load('chalk')).default.blue;

  // Mute regular tap output if so requested.
  if( !args.tap ) muteWritable(process.stdout);

  // Determine test module names.
  const modules = (await readDirectory(tests))
    .filter(name => name.endsWith('.spec.js'));
  if( args.trace ) {
    console.error(highlight(`# found ${modules.map(el => `"${el}"`).join(', ')}.`));
  }

  // Dynamically import each module and invoke the default export.
  for( const name of modules ) {
    const path = resolve(tests, name);
    if( args.trace ) {
      console.error(highlight(`# running "${path}"`));
    }

    const module = await load(path);
    await module.default();

    if( args.trace ) {
      const cover = global.__coverage__;
      if( cover ) {
        for( const key of keysOf(cover) ) {
          console.error(highlight(`# cover for "${key}"`));
        }
      }
    }
  }
})();
