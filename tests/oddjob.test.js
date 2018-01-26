/* (c) Copyright 2017–2018 Robert Grimm */

import {
  dehyphenate,
  deobjectify,
  DuplicateBinding,
  escapeAttribute,
  escapeHTML,
  escapeScript,
  FunctionNotImplemented,
  hyphenate,
  InvalidArgType,
  InvalidArgValue,
  InvalidArrayLength,
  isAttributeQuoted,
  isObject,
  isPropertyKey,
  maybe,
  memoize,
  MissingArgs,
  MultipleCallback,
  normalizeWhitespace,
  show,
  toStableJSON,
  toKeyPath,
  toKeyValue,
  toSymbolKey,
  withExistingKeyPath,
  withKeyPath,
  withKeyValue,
} from '@grr/oddjob';

import harness from './harness';

const { create } = Object;
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };

// -------------------------------------------------------------------------------------------------

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

    t.test('.toKeyValue()', t => {
      t.same(toKeyValue(['k', 9]), ['k', 9]);
      t.same(toKeyValue([9, 'k']), [9, 'k']);
      t.same(toKeyValue({ k: 9 }), ['k', 9]);
      t.same(toKeyValue({ key: 'k', value: 9 }), ['k', 9]);

      function helo() {}
      t.same(toKeyValue(helo), ['helo', helo]);

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

  // -----------------------------------------------------------------------------------------------

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

  // -----------------------------------------------------------------------------------------------

  t.test('functions', t => {
    t.test('.maybe()', t => {
      t.throws(() => maybe(null), CODE_INVALID_ARG_TYPE);

      const fn = (...args) => String(args);

      t.is(maybe(fn, void 0, 2, 3), null);
      t.is(maybe(fn, 1, void 0, 3), null);
      t.is(maybe(fn, 1, 2, void 0), null);

      t.is(maybe(fn, null, 2, 3), null);
      t.is(maybe(fn, 1, null, 3), null);
      t.is(maybe(fn, 1, 2, null), null);

      t.is(maybe(fn, 1, 2, 3), '1,2,3');

      const maybeFn = maybe(fn);

      t.is(maybeFn(void 0, 2, 3), null);
      t.is(maybeFn(1, void 0, 3), null);
      t.is(maybeFn(1, 2, void 0), null);

      t.is(maybeFn(null, 2, 3), null);
      t.is(maybeFn(1, null, 3), null);
      t.is(maybeFn(1, 2, null), null);

      t.is(maybeFn(1, 2, 3), '1,2,3');

      t.is(maybeFn.name, 'fn');
      t.is(maybeFn.length, 0);
      t.end();
    });

    t.test('.deobjectify()', t => {
      const fn = () => {};

      t.is(deobjectify([void 0]), void 0);
      t.is(deobjectify([null]), null);
      t.is(deobjectify([false]), false);
      t.is(deobjectify([0]), 0);
      t.is(deobjectify(['']), '');
      t.is(deobjectify(['yo']), 'yo');
      t.is(deobjectify([fn]), fn);
      t.is(deobjectify([]), '[]');
      t.is(deobjectify([{}]), '[{}]');
      t.is(deobjectify([{}, {}]), '[{},{}]');
      t.end();
    });

    t.test('.memoize()', t => {
      t.throws(() => memoize(null), CODE_INVALID_ARG_TYPE);

      let counter = 0;
      const fn = () => ++counter;
      const memoFn = memoize(fn);

      t.is(memoFn(void 0), 1);
      t.is(memoFn(void 0), 1);
      t.is(memoFn(null), 2);
      t.is(memoFn(null), 2);
      t.is(memoFn('yo'), 3);
      t.is(memoFn('yo'), 3);
      t.is(memoFn(1, 2, 3), 4);
      t.is(memoFn(1, 2, 3), 4);
      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  t.test('strings', t => {
    t.test('.dehyphenate()', t => {
      t.is(dehyphenate(''), '');
      t.is(dehyphenate('some-name'), 'someName');
      t.is(dehyphenate('-some-name'), 'SomeName');
      t.end();
    });

    t.test('.escapeAttribute()', t => {
      t.is(escapeAttribute('mayhem: <&`\'">'), 'mayhem: &lt;&amp;&#x60;&#x27;&quot;&gt;');
      t.end();
    });

    t.test('.escapeHTML()', t => {
      t.is(escapeHTML('&lt;'), '&amp;lt;');
      t.is(escapeHTML('<script>evil()</script>'), '&lt;script&gt;evil()&lt;/script&gt;');
      t.end();
    });

    t.test('.escapeScript()', t => {
      // Picture the string between <script> and </script>.
      t.is(escapeScript(`<!-- ooh -->'<script></script>'`),
        `<\\!-- ooh -->'<\\script><\\/script>'`);
      t.end();
    });

    t.test('.hyphenate()', t => {
      t.is(hyphenate(''), '');
      t.is(hyphenate('someName'), 'some-name');
      t.is(hyphenate('SomeName'), '-some-name');
      t.end();
    });

    t.test('.isAttributeQuoted()', t => {
      t.notOk(isAttributeQuoted('hallo'));
      t.notOk(isAttributeQuoted('https://apparebit.com'));

      t.ok(isAttributeQuoted('\t\n\f\r "&\'=<>'));
      t.ok(isAttributeQuoted(' v'));
      t.ok(isAttributeQuoted('v '));
      t.ok(isAttributeQuoted(' v '));
      t.end();
    });

    t.test('.normalizeWhitespace()', t => {
      t.is(normalizeWhitespace('>>> <<<'), '>>> <<<');
      t.is(normalizeWhitespace('>>> \t\n\f\r\t\n\f\r <<<'), '>>> <<<');
      t.end();
    });

    t.test('.toSymbolKey()', t => {
      // eslint-disable-next-line symbol-description
      t.is(toSymbolKey(Symbol()), '');
      t.is(toSymbolKey(Symbol('665')), '665');
      t.end();
    });

    t.test('.toStableJSON()', t => {
      t.is(toStableJSON(void 0), void 0);
      t.is(toStableJSON(null), 'null');
      t.is(toStableJSON(665), '665');
      t.is(toStableJSON('Hello!'), '"Hello!"');
      t.is(toStableJSON([1, void 0, '3']), '[1,null,"3"]');
      t.is(toStableJSON({ a: void 0, b: NaN, c: 665 }), '{"b":null,"c":665}');
      t.is(toStableJSON({ a: 1, b: 2, c: 3 }), '{"a":1,"b":2,"c":3}');
      t.is(toStableJSON({ c: 3, b: 2, a: 1 }), '{"a":1,"b":2,"c":3}');
      t.is(toStableJSON({
        toJSON() { return { rating: 'completely nuts' }; },
        rating: 'very stable genius'
      }), '{"rating":"completely nuts"}');

      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

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

  // -----------------------------------------------------------------------------------------------

  t.test('errors', t => {
    t.test('.cause', t => {
      const err = InvalidArgValue('k', 'v');
      t.is(err.cause, void 0);

      const cause = Error('boo');
      err.causedBy(cause);
      t.is(err.cause, cause);

      t.end();
    });

    t.test('.code', t => {
      [
        [DuplicateBinding('k', 'v', 'w'),     'ERR_DUPLICATE_BINDING'],
        [FunctionNotImplemented('m'),         'ERR_FUNCTION_NOT_IMPLEMENTED'],
        [InvalidArgType('k', 'v', 't'),       'ERR_INVALID_ARG_TYPE'],
        [InvalidArgValue('k', 'v'),           'ERR_INVALID_ARG_VALUE'],
        [InvalidArgValue(5, 'v', 'a number'), 'ERR_INVALID_ARG_VALUE'],
        [InvalidArrayLength('k', 1, 2),       'ERR_INVALID_ARRAY_LENGTH'],
        [MissingArgs('n1', 'n2'),             'ERR_MISSING_ARGS'],
        [MultipleCallback('cb'),              'ERR_MULTIPLE_CALLBACK'],
      ].forEach(([err, code]) => {
        t.is(err.code, code);
      });

      t.end();
    });

    t.test('.message', t => {
      const arg = null;
      t.is(FunctionNotImplemented('f').message,
        'function "f" is not implemented');
      t.is(FunctionNotImplemented('f', 'factory function').message,
        'factory function "f" is not implemented');
      t.is(InvalidArgType({ arg }, 'a number').message,
        'argument "arg" is "null", but should be a number');
      t.is(InvalidArgType({ arg }, 'not', 'a number').message,
        'argument "arg" is "null", but should not be a number');
      t.is(InvalidArgValue({ arg }).message,
        'argument "arg" is "null"');
      t.is(InvalidArgValue({ arg }, 'should be an even number').message,
        'argument "arg" is "null", but should be an even number');
      t.is(MultipleCallback('cb').message,
        'repeated invocation of callback "cb"');
      t.is(MultipleCallback('cb', 'from same handler context').message,
        'repeated invocation of callback "cb" from same handler context');

      t.end();
    });

    t.test('.name', t => {
      [
        [InvalidArgType('k', 'v', 't'), 'TypeError [ERR_INVALID_ARG_TYPE]'],
        [InvalidArgValue('k', 'v'),     'Error [ERR_INVALID_ARG_VALUE]'],
      ].forEach(([err, name]) => {
        t.is(err.name, name);
      });

      t.end();
    });

    t.end();
  });

  t.end();
});
