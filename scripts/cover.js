/* (c) Copyright 2018 Robert Grimm */

import { join, resolve } from 'path';
import { promisify } from 'util';
import { readdir as doReaddir, readFile as doReadFile } from 'fs';

const { keys: keysOf } = Object;
const { parse } = JSON;
const readdir = promisify(doReaddir);
const readFile = promisify(doReadFile);

(async function run() {
  const path = resolve('.nyc_output');
  const files = await readdir(path);

  for( const file of files ) {
    // eslint-disable-next-line no-await-in-loop
    const text = await readFile(join(path, file));
    const data = parse(text);
    const keys = keysOf(data);

    console.log(`${file}:`);
    for( const key of keys ) {
      console.log(`  ${key}`);
    }
  }
})();
