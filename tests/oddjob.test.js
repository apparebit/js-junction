/* (c) Copyright 2017 Robert Grimm */

import {
  dehyphenate,
  DuplicateBinding,
  hyphenate,
  InvalidArgType,
  InvalidArgValue,
  InvalidArrayLength,
  MissingArgs,
  show,
} from '@grr/oddjob';

import harness from './harness';

harness.test( '@grr/oddjob', t => {
  t.test('errors', t => {
    t.is(DuplicateBinding('k', 'v', 'w').code, 'ERR_DUPLICATE_BINDING');
    t.is(InvalidArgType('k', 'v', 't').code, 'ERR_INVALID_ARG_TYPE');
    t.is(InvalidArgValue('k', 'v').code, 'ERR_INVALID_ARG_VALUE');
    t.is(InvalidArrayLength('k', 1, 2).code, 'ERR_INVALID_ARRAY_LENGTH');
    t.is(MissingArgs('n1', 'n2').code, 'ERR_MISSING_ARGS');

    t.is(InvalidArgType('k', 'v', 't').name, 'TypeError [ERR_INVALID_ARG_TYPE]');
    t.is(InvalidArgValue('k', 'v').name, 'Error [ERR_INVALID_ARG_VALUE]');

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('.show()', t => {
    const showElements = show().elements();
    [
      [[], 'none'],
      [[1], '1'],
      [[1, 2], '1 and 2'],
      [[1, 2, 3], '1, 2, and 3']
    ].forEach(([input, output]) => t.is(showElements.of(input), output));

    t.is(show().length().of([0]), '1');
    t.is(show().verbatim('the').length().of([0]), 'the 1');

    t.is(
      show()
        .verbatim('a')
        .quoted.elements(false)
        .of([1, 2]),
      'a "1" or "2"');

    t.is(
      show()
        .verbatim('nothing')
        .verbatim('and')
        .elements()
        .noun('element')
        .of([]),
      'nothing and no elements');

    t.is(show().noun('element').of([665]), 'element');
    t.is(show().verb().of([665]), 'is');
    t.is(show().verb('contain').of([665]), 'contains');
    t.is(show().verb('contain').of([42, 665]), 'contain');

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('strings', t => {
    t.test('.dehyphenate()', t => {
      t.is(dehyphenate(''), '');
      t.is(dehyphenate('some-name'), 'someName');
      t.is(dehyphenate('-some-name'), 'SomeName');
      t.end();
    });

    t.test('.hyphenate()', t => {
      t.is(hyphenate(''), '');
      t.is(hyphenate('someName'), 'some-name');
      t.is(hyphenate('SomeName'), '-some-name');
      t.end();
    });

    t.end();
  });

  t.end();
});
