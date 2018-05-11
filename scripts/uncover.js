/* (c) Copyright 2018 Robert Grimm */

import chalk from 'chalk';
import { dirname, relative, resolve } from 'path';
import { EOL } from 'os';
import { instrumented } from '@grr/oddjob/packages';
import { promisify } from 'util';
import { readdir as doReadDirectory, readFile as doReadFile } from 'fs';

const { keys: keysOf } = Object;
const { parse } = JSON;
const readDirectory = promisify(doReadDirectory);
const readFile = promisify(doReadFile);

// N.B.: Print to stderr instead of stdout, since node-tap uses the latter.

(async function run() {
  const root = resolve(__dirname, '..');
  const pkgs = resolve(root, 'packages');
  const mapping = await instrumented(root);
  const originals = keysOf(mapping).sort();

  // *** Print original module name for each instrumented module ***
  if( originals.length ) {
    console.error(`${EOL}${chalk.bold.black('Modules Instrumented by NYC')}`);

    let header;
    for( const original of originals ) {
      const pkg = `@grr/${relative(pkgs, dirname(original))}`;

      if( pkg !== header ) {
        header = pkg;
        console.error(`${EOL}${chalk.underline.black(pkg)}${EOL}`);
      }

      console.error(chalk.black(original));
      console.error(chalk.gray(`  => ${mapping[original]}`));
    }
  }

  // *** Print original module name for each module with saved coverage ***
  const nycOutput = resolve(root, '.nyc_output');

  let files;
  try {
    files = (await readDirectory(nycOutput))
      .filter(name => name[0] !== '.' && name.endsWith('.json'));
  } catch(x) {
    if( x.code === 'ENOENT' ) {
      files = [];
    } else {
      throw x;
    }
  }

  const coverset = new Set();
  for( const file of files ) {
    const path = resolve(nycOutput, file);
    const text = await readFile(path, 'utf8');
    for( const key of keysOf(parse(text)) ) {
      coverset.add(key);
    }
  }

  const covered = [...coverset].sort();
  if( covered.length ) {
    console.error(chalk.bold.black(`${EOL}Modules Covered by NYC${EOL}`));

    for( const path of [...covered].sort() ) {
      console.error(chalk.black(path));
    }

    console.error();
  }
})();
