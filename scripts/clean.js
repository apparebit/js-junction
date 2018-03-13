/* (c) Copyright 2018 Robert Grimm */

import rimraf from 'rimraf';
import util from 'util';

const doRemove = util.promisify(rimraf);
const remove = pattern => doRemove(pattern, {});

(async function run() {
  await Promise.all([
    '.nyc_output',
    'coverage',
    'yarn-error.log',
    'node_modules/.cache',
  ].map(remove));
})();
