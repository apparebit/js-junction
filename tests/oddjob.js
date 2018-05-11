/* (c) Copyright 2017–2018 Robert Grimm */

import {
  constant,
  dehyphenate,
  deobjectify,
  enumerable,
  escapeAttribute,
  escapeHTML,
  escapeScript,
  hyphenate,
  isAttributeQuoted,
  isIterable,
  isIterator,
  IteratorPrototype,
  maybe,
  memoize,
  muteWritable,
  normalizeWhitespace,
  toStableJSON,
  toKeyPath,
  toSymbolKey,
  value,
  withExistingKeyPath,
  withKeyPath,
  withoutInspector,
} from '@grr/oddjob';

import harness from './harness';
import { Writable } from 'stream';

const { create } = Object;
const { iterator } = Symbol;

const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };

export default harness(__filename, t => {
  t.test('descriptors', t => {
    t.test('.constant()', t => {
      t.same(constant(665), {
        configurable: false,
        enumerable: false,
        value: 665,
        writable: false,
      });

      t.same(constant(665, enumerable), {
        configurable: false,
        enumerable: true,
        value: 665,
        writable: false,
      });

      t.end();
    });

    t.test('.value()', t => {
      t.same(value(665), {
        configurable: true,
        enumerable: false,
        value: 665,
        writable: false,
      });

      t.same(value(665, { enumerable, numeric: true }), {
        configurable: true,
        enumerable: true,
        numeric: true,
        value: 665,
        writable: false,
      });

      t.end();
    });

    t.end();
  });

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

  t.test('iteration', t => {
    t.test('.isIterable()', t => {
      t.notOk(isIterable(void 0));
      t.notOk(isIterable(null));
      t.notOk(isIterable(false));
      t.notOk(isIterable(true));
      t.notOk(isIterable(665));
      t.notOk(isIterable({}));

      t.ok(isIterable(''));
      t.ok(isIterable([]));
      t.ok(isIterable((function* gen() {})()));
      t.ok(isIterable(new Map()));
      t.ok(isIterable(new Set()));

      t.ok(isIterable({
        [iterator]() { return { next() { return { done: true }; }}; },
      }));

      t.ok(isIterable({
        [iterator]() { return this; },
        next() { return { done: true }; },
      }));

      t.end();
    });

    t.test('.isIterator()', t => {
      t.notOk(isIterator(void 0));
      t.notOk(isIterator(null));
      t.notOk(isIterator(false));
      t.notOk(isIterator(true));
      t.notOk(isIterator(665));
      t.notOk(isIterator({}));

      t.ok(isIterator(''[iterator]()));
      t.ok(isIterator([][iterator]()));
      t.ok(isIterator((function* gen() {})()));

      t.ok(isIterator({
        [iterator]() { return { next() { return { done: true }; }}; },
      }[iterator]()));

      t.ok(isIterator({
        [iterator]() { return this; },
        next() { return { done: true }; },
      }));

      t.end();
    });

    t.test('.IteratorPrototype()', t => {
      const iter = create(IteratorPrototype, {
        next: { value: () => ({ done: true })}
      });

      t.ok(isIterable(iter));
      t.ok(isIterator(iter));
      t.end();
    });

    t.end();
  });

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

  t.test('processes', t => {
    t.test('withoutInspector()', t => {
      t.same(withoutInspector(['--inspect']), []);
      t.same(withoutInspector(['--inspect-brk']), []);
      t.same(withoutInspector(['--inspect-port']), []);
      t.same(withoutInspector(['--inspect=665']), []);
      t.same(withoutInspector(['--inspect-brk=665']), []);
      t.same(withoutInspector(['--inspect-port=665']), []);
      t.same(withoutInspector(['--debug']), []);
      t.same(withoutInspector(['--debug-brk']), []);
      t.same(withoutInspector(['--debug-port']), []);
      t.same(withoutInspector(['--whatever']), ['--whatever']);
      t.end();
    });

    t.end();
  });

  t.test('streams', t => {
    t.test('muteWritable()', t => {
      const log = [];
      const out = new Writable({
        decodeStrings: false,
        write(chunk, encoding, callback) {
          log.push(chunk);
          callback();
        }
      });

      out.write('1');
      t.same(log, ['1']);

      const unmute = muteWritable(out);
      out.write('2');
      out.write('c1', () => log.push('c1'));
      out.write('c2', 'utf8', () => log.push('c2'));
      t.same(log, ['1', 'c1', 'c2']);

      unmute();
      out.write('3');
      t.same(log, ['1', 'c1', 'c2', '3']);

      t.end();
    });

    t.end();
  });

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

  t.end();
});
