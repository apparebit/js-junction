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
  default: {
    only: '',
    tap: true,
    verbose: false,
  },
});

(async function main() {
  // If node-tap found stdout to be colorful, force chalk to be colorful too.
  if (process.env.TAP_COLORS === '1') process.env.FORCE_COLOR = '1';
  const colorize = (await load('chalk')).default.blue;
  const highlight = message => {
    if (args.verbose) console.error(colorize(message));
  };

  // Mute regular tap output if so requested.
  if (!args.tap) muteWritable(process.stdout);

  // Determine the test modules to run.
  const only = args.only !== '' ? `${args.only}.spec.js` : null;
  const modules = (await readDirectory(tests)).filter(
    name =>
      // The module must be a properly named test.
      name.endsWith('.spec.js') &&
      // Either all tests should run or the module is the only test to run.
      (only == null || only === name)
  );
  highlight(`# found ${modules.map(el => `"${el}"`).join(', ')}.`);

  // Dynamically import each module and invoke the default export.
  for (const name of modules) {
    const path = resolve(tests, name);
    highlight(`# running "${path}"`);

    const module = await load(path);
    await module.default();

    if (args.verbose) {
      const cover = global.__coverage__;
      if (cover) {
        for (const key of keysOf(cover)) {
          highlight(`# cover for "${key}"`);
        }
      }
    }
  }
})();
