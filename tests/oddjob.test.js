/* (c) Copyright 2017 Robert Grimm */

import {
  dehyphenate,
  DuplicateBinding,
  getOwnPropertyKeys,
  hyphenate,
  InvalidArgType,
  InvalidArgValue,
  InvalidArrayLength,
  isObject,
  isPropertyKey,
  MethodNotImplemented,
  MissingArgs,
  realm,
  show,
  toKeyPath,
  toKeyValue,
  toRealm,
  toSymbolKey,
  withExistingKeyPath,
  withKeyPath,
  withKeyValue,
} from '@grr/oddjob';

import harness from './harness';

const { create } = Object;
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };

// -----------------------------------------------------------------------------

harness.test( '@grr/oddjob', t => {
  t.test('objects', t => {
    t.test('.isObject()', t => {
      t.notOk(isObject(void 0));
      t.notOk(isObject(null));
      t.ok(isObject({}));
      t.ok(isObject(create(null)));
      t.ok(isObject(() => {}));
      t.ok(isObject(function fn() {}));
      t.end();
    });

    t.test('.isPropertyKey()', t => {
      t.notOk(isPropertyKey());
      t.notOk(isPropertyKey(null));

      t.ok(isPropertyKey(42));
      t.ok(isPropertyKey(''));
      t.ok(isPropertyKey('key'));
      t.ok(isPropertyKey(Symbol('ooh special')));
      t.end();
    });

    t.test('.getOwnPropertyKeys()', t => {
      const sym = Symbol('ooh special');
      const oh = {
        a: 1,
        [sym]: 42,
        __proto__: { b: 2 },
      };

      t.same(getOwnPropertyKeys(oh), ['a', sym]);
      t.end();
    });

    t.test('.toKeyValue()', t => {
      t.same(toKeyValue(['k', 9]), ['k', 9]);
      t.same(toKeyValue([9, 'k']), [9, 'k']);
      t.same(toKeyValue({ k: 9 }), ['k', 9]);
      t.same(toKeyValue({ key: 'k', value: 9 }), ['k', 9]);

      [
        [],
        [null, 2],
        {},
        { a: 1, b: 2, c: 3 },
        { __proto__: { k: 'v' }},
      ].forEach(input => {
        t.throws(() => toKeyValue(input), CODE_INVALID_ARG_VALUE);
      });

      t.end();
    });

    t.test('.withKeyValue()', t => {
      /* eslint-disable key-spacing */
      const fn = (...args) => args;
      const fn0 = withKeyValue(fn);
      const fn1 = withKeyValue(fn, 1);
      const fn13 = withKeyValue(fn, 1, 3);

      t.same(fn0( 'k', 9  ), ['k', 9]);
      t.same(fn0({ k:  9 }), ['k', 9]);

      t.same(fn1( 10,  'k', 9  ), [10, 'k', 9]);
      t.same(fn1( 10, { k:  9 }), [10, 'k', 9]);

      t.same(fn13( 10,  'k', 9,    'l', 8  ), [10, 'k', 9, 'l', 8]);
      t.same(fn13( 10, { k:  9 }, { l:  8 }), [10, 'k', 9, 'l', 8]);

      t.end();
      /* eslint-enable key-spacing */
    });

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('key-path', t => {
    const sym = Symbol('ooh special');

    t.test('.toKeyPath()', t => {
      t.same(toKeyPath(), []);
      t.same(toKeyPath(''), ['']);
      t.same(toKeyPath('one'), ['one']);
      t.same(toKeyPath('one.two'), ['one', 'two']);
      t.same(toKeyPath('one.two.three'), ['one', 'two', 'three']);
      t.same(toKeyPath(1), ['1']);
      t.same(toKeyPath(sym), [sym]);
      t.same(toKeyPath(['a', 'b', 'c']), ['a', 'b', 'c']);

      t.throws(() => toKeyPath(true), CODE_INVALID_ARG_TYPE);
      t.end();
    });

    t.test('.withKeyPath()', t => {
      t.throws(() => withKeyPath(0, '', () => {}),
        CODE_INVALID_ARG_TYPE);
      t.throws(() => withKeyPath({ a: { b: 665 }}, 'a.b.c'),
        CODE_INVALID_ARG_TYPE);

      const root = {};
      withKeyPath(root, 'a.b.c', (object, key) => { object[key] = 42; });
      t.same(root, { a: { b: { c: 42 }}});

      t.end();
    });

    t.test('.withExistingKeyPath()', t => {
      const root = { a: { b: { c: 665 }}};
      t.is(withExistingKeyPath(root, 'a.b.c')[2], 665);
      t.is(withExistingKeyPath({ a: { b: { c: 665 }}}, 'a.c'), void 0);
      t.is(withExistingKeyPath({ a: { b: { c: 665 }}}, 'a.c.d'), void 0);

      t.end();
    });

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

    t.test('.toSymbolKey()', t => {
      // eslint-disable-next-line symbol-description
      t.is(toSymbolKey(Symbol()), '');
      t.is(toSymbolKey(Symbol('665')), '665');
      t.end();
    });

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
    ].forEach(([input, output]) => {
      t.is(showElements.of(input), output);
    });

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

  t.test('errors', t => {
    [
      [DuplicateBinding('k', 'v', 'w'),     'ERR_DUPLICATE_BINDING'],
      [InvalidArgType('k', 'v', 't'),       'ERR_INVALID_ARG_TYPE'],
      [InvalidArgValue('k', 'v'),           'ERR_INVALID_ARG_VALUE'],
      [InvalidArgValue(5, 'v', 'a number'), 'ERR_INVALID_ARG_VALUE'],
      [InvalidArrayLength('k', 1, 2),       'ERR_INVALID_ARRAY_LENGTH'],
      [MethodNotImplemented('m'),           'ERR_METHOD_NOT_IMPLEMENTED'],
      [MissingArgs('n1', 'n2'),             'ERR_MISSING_ARGS'],
    ].forEach(([err, code]) => {
      t.is(err.code, code);
    });

    [
      [InvalidArgType('k', 'v', 't'), 'TypeError [ERR_INVALID_ARG_TYPE]'],
      [InvalidArgValue('k', 'v'),     'Error [ERR_INVALID_ARG_VALUE]'],
    ].forEach(([err, name]) => {
      t.is(err.name, name);
    });

    const arg = null;
    t.is(InvalidArgType({ arg }, 'a number').message,
      'argument "arg" is "null", but should be a number');
    t.is(InvalidArgType({ arg }, 'not', 'a number').message,
      'argument "arg" is "null", but should not be a number');
    t.is(InvalidArgValue({ arg }).message,
      'argument "arg" is "null"');
    t.is(InvalidArgValue({ arg }, 'an even number').message,
      'argument "arg" is "null", but should be an even number');
    t.is(InvalidArgValue({ arg }, 'not', 'falsy').message,
      'argument "arg" is "null", but should not be falsy');

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('realm', t => {
    t.is(realm, 'development');

    t.is(toRealm(), 'development');
    t.is(toRealm('dev'), 'development');
    t.is(toRealm('prod'), 'production');
    t.is(toRealm('PROD'), 'production');
    t.is(toRealm('QA'), 'qa');
    t.end();
  });

  t.end();
});
