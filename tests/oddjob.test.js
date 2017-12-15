/* (c) Copyright 2017 Robert Grimm */

import {
  dehyphenate,
  DuplicateBinding,
  hyphenate,
  InvalidArgType,
  InvalidArgValue,
  InvalidArrayLength,
  isObject,
  MethodNotImplemented,
  MissingArgs,
  realm,
  show,
  toKeyPath,
  toRealm,
  toSymbolKey,
  withExistingKeyPath,
  withKeyPath,
} from '@grr/oddjob';

import harness from './harness';

const { create } = Object;
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };

harness.test( '@grr/oddjob', t => {
  // ---------------------------------------------------------------------------

  t.test('errors', t => {
    t.is(DuplicateBinding('k', 'v', 'w').code, 'ERR_DUPLICATE_BINDING');
    t.is(InvalidArgType('k', 'v', 't').code, 'ERR_INVALID_ARG_TYPE');
    t.is(InvalidArgValue('k', 'v').code, 'ERR_INVALID_ARG_VALUE');
    t.is(InvalidArgValue(5, 'v', 'a number').code, 'ERR_INVALID_ARG_VALUE');
    t.is(InvalidArrayLength('k', 1, 2).code, 'ERR_INVALID_ARRAY_LENGTH');
    t.is(MethodNotImplemented('m').code, 'ERR_METHOD_NOT_IMPLEMENTED');
    t.is(MissingArgs('n1', 'n2').code, 'ERR_MISSING_ARGS');

    t.is(InvalidArgType('k', 'v', 't').name,
      'TypeError [ERR_INVALID_ARG_TYPE]');
    t.is(InvalidArgValue('k', 'v').name,
      'Error [ERR_INVALID_ARG_VALUE]');

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('properties', t => {
    const sym = Symbol('symbolic');

    t.test('.toKeyPath()', t => {
      t.same(toKeyPath(), []);
      t.same(toKeyPath(''), []);
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

    t.test('withExistingKeyPath', t => {
      const root = { a: { b: { c: 665 }}};
      t.is(withExistingKeyPath(root, 'a.b.c')[2], 665);
      t.is(withExistingKeyPath({ a: { b: { c: 665 }}}, 'a.c'), undefined);
      t.is(withExistingKeyPath({ a: { b: { c: 665 }}}, 'a.c.d'), undefined);

      t.end();
    });

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

    t.test('.toSymbolKey()', t => {
      // eslint-disable-next-line symbol-description
      t.is(toSymbolKey(Symbol()), '');
      t.is(toSymbolKey(Symbol('665')), '665');
      t.end();
    });

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('types', t => {
    t.notOk(isObject(void 0));
    t.notOk(isObject(null));
    t.ok(isObject({}));
    t.ok(isObject(create(null)));
    t.ok(isObject(() => {}));
    t.ok(isObject(function fn() {}));
    t.end();
  });

  t.end();
});
