/* (c) Copyright 2018 Robert Grimm */

// Do not even think of using esm, since it writes metadata to its cache at
// `node_modules/.cache/esm` on process exit. That is somewhat less than optimal
// for a script, which seeks to delete all such caches.

const doReadDirectory = require('fs').readdir;
const { resolve } = require('path');
const rimraf = require('rimraf');
const { promisify } = require('util');

const all = Promise.all.bind(Promise);
const { argv } = process;
const doRemove = promisify(rimraf);
const readDirectory = promisify(doReadDirectory);
const remove = pattern => doRemove(pattern, {});
const deep = argv.includes('--deep');
const clobber = argv.includes('--clobber');

const ROOT = resolve(__dirname, '..');

async function removeNamedDirectories() {
  // Beware of accidentally deleting the test fixtures via `**/node_modules`!
  let patterns;
  if (!deep) {
    patterns = [
      'node_modules/.cache/esm',
      'packages/*/node_modules/.cache/esm',
    ];
  } else {
    patterns = [
      '.nyc_output',
      'coverage',
      'yarn-error.log',
      'node_modules/.cache',
      'packages/*/node_modules/.cache',
    ];
  }

  await all(patterns.map(pattern => remove(resolve(ROOT, pattern))));
}

async function removeEmptyDirectories() {
  // Sort the directories from longest to shortest path so that a child is
  // always considered before its parent and the child's deletion also enables
  // the parent's deletion if it is an only child — directory of course.
  const glob = require('fast-glob'); // eslint-disable-line global-require

  const paths = (await glob('packages/*/node_modules/**/', {
    absolute: true,
    cwd: resolve(__dirname, '..'),
    dot: true,
    onlyDirectories: true,
    onlyFiles: false,
    unique: true,
  })).sort((a, b) => b.length - a.length);

  for (const path of paths) {
    if ((await readDirectory(path)).length === 0) {
      await remove(path);
    }
  }
}

async function removeNestedNodeModules() {
  await remove(resolve(ROOT, 'packages/*/node_modules'));
}

removeNamedDirectories();
if (deep || clobber) removeEmptyDirectories();
if (clobber) removeNestedNodeModules();
