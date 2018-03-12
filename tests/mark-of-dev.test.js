/* (c) Copyright 2018 Robert Grimm */

import { resolve } from 'path';
import { default as harness, dynaload, testdir } from './harness';

function main() {
  const node = process.execPath;
  const args = [...process.execArgv, resolve(testdir, 'mark-of-dev.test.js')];

  harness.test( '@grr/mark-of-dev', t => {
    t.jobs = 10;

    t.spawn(node, [...args, '--test-dev-mode'], { env: {} });
    t.spawn(node, [...args, '--test-dev-mode'], { env: { NODE_ENV: 'dev' } });
    t.spawn(node, [...args, '--test-dev-mode'], { env: { NODE_ENV: 'DEV' } });
    t.spawn(node, [...args, '--test-dev-mode'], { env: { NODE_ENV: 'development' } });
    t.spawn(node, [...args, '--test-dev-mode'], { env: { NODE_ENV: 'soccer' } });

    t.spawn(node, [...args, '--test-prod-mode'], { env: { NODE_ENV: 'prod' } });
    t.spawn(node, [...args, '--test-prod-mode'], { env: { NODE_ENV: 'PROD' } });
    t.spawn(node, [...args, '--test-prod-mode'], { env: { NODE_ENV: 'production' } });
    t.spawn(node, [...args, '--test-prod-mode'], { env: { NODE_ENV: 'PRODUCTION' } });

    t.spawn(node, [...args, '--test-special-mode'], { env: {} });

    t.end();
  });
}

async function helper(mode) {
  await harness.test('@grr/mark-of-dev', async function test(t) {
    t.notOk('__DEV__' in global);
    if( mode === '--test-special-mode' ) global.__DEV__ = 'special';

    await dynaload('@grr/mark-of-dev');

    switch( mode ) {
      case '--test-dev-mode':
        t.is(__DEV__, true);
        break;
      case '--test-prod-mode':
        t.is(__DEV__, false);
        t.is(process.env.NODE_ENV, 'production');
        break;
      case '--test-special-mode':
        t.is(__DEV__, 'special');
        break;
      default:
        t.fail(`invalid test mode "${mode}"`);
    }

    t.end();
  });
}

const VALID_MODES = new Set([
  '--test-dev-mode',
  '--test-prod-mode',
  '--test-special-mode',
]);

const mode = (function mode() {
  for( const arg of process.argv.slice(2) ) {
    if( VALID_MODES.has(arg) ) return arg;
  }
  return 'main';
})();

if( mode === 'main' ) {
  main();
} else {
  helper(mode);
}
