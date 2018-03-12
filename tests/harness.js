/* (c) Copyright 2017–2018 Robert Grimm */

import { dirname } from 'path';
import { URL } from 'url';

export { default } from 'tap';

// ESLint does not parse the dynamic import form yet. Hence we wrap it for now.
export function dynaload(name) {
  return import(name);
}

// VSCode, in turn, does not parse `import.meta` yet. Also there is only one
// test directory, hence we determine the test directory once.
export const testdir = dirname(new URL(import.meta.url).pathname);
