/* (c) Copyright 2018 Robert Grimm */

// Do not even think of using esm, since it writes metadata to its cache at
// `node_modules/.cache/esm` on process exit. That is somewhat less than optimal
// for a script, which seeks to delete all such caches.

const { resolve } = require('path');
const rimraf = require('rimraf');
const { promisify } = require('util');

const doRemove = promisify(rimraf);
const remove = pattern => doRemove(pattern, {});

(async function run() {
  await Promise.all([
    '.nyc_output',
    'coverage',
    'yarn-error.log',
    '**/node_modules/.cache'
  ].map(pattern => remove(resolve(__dirname, '..', pattern))));
})();
