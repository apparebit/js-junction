/* (c) Copyright 2017 Robert Grimm */

import {
  dehyphenate,
  hyphenate,
} from '@grr/oddjob';

import harness from './harness';

harness.test( '@grr/oddjob', t => {
  t.test('.dehyphenate', t => {
    t.is(dehyphenate(''), '');
    t.is(dehyphenate('some-name'), 'someName');
    t.is(dehyphenate('-some-name'), 'SomeName');
    t.end();
  });

  t.test('.hyphenate', t => {
    t.is(hyphenate(''), '');
    t.is(hyphenate('someName'), 'some-name');
    t.is(hyphenate('SomeName'), '-some-name');
    t.end();
  });

  t.end();
});
