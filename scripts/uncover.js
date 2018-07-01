/* (c) Copyright 2018 Robert Grimm */

import chalk from 'chalk';
import { dirname, relative, resolve } from 'path';
import { EOL } from 'os';
import { findInstrumentedModules, findCoveredModules } from '@grr/inventory';

const { keys: keysOf } = Object;

// N.B.: Print to stderr instead of stdout, since node-tap uses the latter.

(async function run() {
  const root = resolve(__dirname, '..');
  const pkgs = resolve(root, 'packages');
  const mapping = await findInstrumentedModules(root);
  const originals = keysOf(mapping).sort();

  // *** Print original module name for each instrumented module ***
  if (originals.length) {
    console.error(`${EOL}${chalk.bold.black('Modules Instrumented by NYC')}`);

    let header;
    for (const original of originals) {
      const pkg = `@grr/${relative(pkgs, dirname(original))}`;

      if (pkg !== header) {
        header = pkg;
        console.error(`${EOL}${chalk.underline.black(pkg)}${EOL}`);
      }

      console.error(chalk.black(original));
      for (const instrumented of mapping[original]) {
        console.error(chalk.gray(`  => ${instrumented}`));
      }
    }
  }

  // *** Print original module name for each module with saved coverage ***
  const covered = findCoveredModules();
  if (covered.length) {
    console.error(chalk.bold.black(`${EOL}Modules Covered by NYC${EOL}`));

    for (const path of covered.sort()) {
      console.error(chalk.black(path));
    }
  }

  console.error();
})();
