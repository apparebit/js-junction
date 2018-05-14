/* (c) Copyright 2018 Robert Grimm */

import { constant } from '@grr/oddjob/descriptors';
import { default as harness, load } from './harness';
import { withoutInspector } from '@grr/oddjob/processes';

const { defineProperty } = Object;
const { env, execPath } = process;
const { has } = Reflect;
const mode = env.MARK_OF_DEV_TEST;
const RUNNING = Symbol.for('mark-of-dev-test');

const CASES = [
  ['dev'],
  ['dev', 'dev'],
  ['dev', 'DEV'],
  ['dev', 'development'],
  ['dev', 'soccer'],
  ['dev', 'produce'],
  ['dev', 'product'],
  ['prod', 'prod'],
  ['prod', 'PROD'],
  ['prod', 'production'],
  ['prod', 'PRODUCTION'],
  ['oops'],
];

export default harness(__filename, async function run(t) {
  // Protect against this module becoming a fork bomb!
  if( mode === void 0 && !global[RUNNING] ) {
    defineProperty(global, RUNNING, constant(true));

    for( const [expected, actual] of CASES ) {
      const options = {
        buffered: true,
        env: { MARK_OF_DEV_TEST: expected },
      };
      if( actual !== void 0 ) options.env.NODE_ENV = actual;

      await t.spawn(execPath, [...withoutInspector(), __filename], options);
    }

    t.end();
  }
});

async function testcase() {
  const hasMark = has(global, '__DEV__');
  if( mode === 'oops' ) global.__DEV__ = 'oops';

  await load('@grr/mark-of-dev');

  await harness(mode, t => {
    t.is(hasMark, false);

    switch( mode ) {
      case 'dev':
        t.is(__DEV__, true);
        break;
      case 'prod':
        t.is(__DEV__, false);
        t.is(process.env.NODE_ENV, 'production');
        break;
      case 'oops':
        t.is(__DEV__, 'oops');
        break;
      default:
        t.fail(`invalid test mode "${mode}"`);
    }

    t.end();
  })();
}

if( mode === 'dev' || mode === 'prod' || mode === 'oops') {
  testcase();
}
