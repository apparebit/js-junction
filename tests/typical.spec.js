/* (c) Copyright 2018 Robert Grimm */

import tip from '@grr/typical';
import Context from '@grr/typical/context.js';
import harness from './harness';
import { isArray } from 'util';

const { assign, getOwnPropertySymbols, getPrototypeOf, is } = Object;
const { iterator, toStringTag } = Symbol;
const { MAX_SAFE_INTEGER } = Number;

export default harness(__filename, t => {
  t.test('Context', t => {
    t.test('.isRequired()', t => {
      t.ok(Context.isRequired());
      t.ok(Context.isRequired(null));
      t.ok(Context.isRequired({ [Symbol('context')]: true }));
      t.notOk(Context.isRequired(new Context()));
      t.end();
    });

    t.test('.mergeConfig()', t => {
      t.same(
        Context.mergeConfig(
          { label: 'primary', shadow: false, first: 1, second: void 0 },
          { label: 'secondary', shadow: true, second: 2 }
        ),
        { label: 'primary', shadow: false, first: 1, second: 2 }
      );
      t.end();
    });

    const context = new Context();
    context.continueAfterError = true;
    context.path.push(new Error());
    context.path.push(new Error());

    t.test('#reset()', t => {
      t.is(context.continueAfterError, true);
      t.is(context.path.length, 2);
      t.type(context.path[0], Error);
      t.type(context.path[1], Error);

      const c = context.reset();

      t.is(c, context);
      t.is(context.validateAndCopy, void 0);
      t.is(context.continueAfterError, void 0);
      t.is(context.ignoreExtraProps, void 0);
      t.is(context.recognizeAsArray, void 0);
      t.same(context.path, []);
      t.same(context.errors, []);

      t.end();
    });

    t.test('#enter()', t => {
      context.enter('key');
      t.same(context.path, ['key']);
      t.end();
    });

    t.test('#exit()', t => {
      context.exit();
      t.same(context.path, []);
      t.end();
    });

    t.test('#toValue()', t => {
      const s = Symbol('the-one');
      t.is(context.toValue(s), s);
      t.end();
    });

    t.test('#isArray()', t => {
      t.ok(context.isArray([]));
      t.ok(context.isArray([0]));
      t.ok(context.isArray(['']));
      t.notOk(context.isArray());
      t.notOk(context.isArray(null));
      t.notOk(context.isArray(0));
      t.notOk(context.isArray(''));
      t.end();
    });

    t.test('#toArray()', t => {
      t.same(context.toArray(0), []);
      t.same(context.toArray(1, 'element'), ['element']);
      t.same(context.toArray(2, ['my', 'precious']), ['my', 'precious']);
      t.end();
    });

    context.enter(7);
    const MESSAGE1 = `value "665" of property "7" is not of type String`;
    const wrapper1 = context.valueIsNotOfType(665, tip.String);
    let marker;

    t.test('#valueIsNotOfType()', t => {
      t.is(context.errors.length, 1);
      t.is(context.errors[0].message, MESSAGE1);

      const symbols = getOwnPropertySymbols(wrapper1);
      t.is(symbols.length, 1);
      t.is(typeof symbols[0], 'symbol');
      t.is(String(symbols[0]), 'Symbol(error)');
      [marker] = symbols;

      t.is(context.errors.length, 1);
      t.end();
    });

    context.enter('name');
    const EXTRA_KEY = `value of property "7.name" has extra key`;
    const MESSAGE2 = `${EXTRA_KEY} "key"`;
    const wrapper2 = context.valueHasExtraProperties({ key: 'value' }, ['key']);

    t.test('#valueHasExtraProperties()', t => {
      // Test with keys on context path.
      t.is(context.errors.length, 2);
      t.is(context.errors[1].message, MESSAGE2);

      const symbols = getOwnPropertySymbols(wrapper2);
      t.is(symbols.length, 1);
      t.is(symbols[0], symbols[0]);
      t.is(symbols[0], marker);

      // Test with empty context path. Restore context afterwards.
      const { path } = context;
      context.path = [];

      try {
        t.is(
          context.unwrapErrors(context.valueHasExtraProperties({}, ['key']))
            .message,
          `value has extra key "key"`
        );
      } finally {
        context.errors.pop();
        context.path = path;
      }

      t.end();
    });

    let err1, err2;

    t.test('#unwrapErrors()', t => {
      err1 = context.unwrapErrors(wrapper1);
      t.same(err1, context.errors[0]);
      t.type(err1, TypeError);

      err2 = context.unwrapErrors(wrapper2);
      t.same(err2, context.errors[1]);
      t.type(err2, TypeError);

      t.end();
    });

    t.test('#wrapErrors()', t => {
      const w1 = context.wrapErrors(err1);
      t.same(w1[marker], [err1]);
      t.is(context.unwrapErrors(w1), err1);

      const w2 = context.wrapErrors(err2);
      t.same(w2[marker], [err2]);
      t.is(context.unwrapErrors(w2), err2);

      const errors = [err1, err2];
      const w3 = context.wrapErrors(errors);
      t.is(w3[marker], errors);
      t.is(context.unwrapErrors(w3, true), errors);

      t.end();
    });

    t.test('#mergeWrappers()', t => {
      const merged = context.mergeWrappers(wrapper1, wrapper2);
      t.ok(context.isErrorWrapper(merged));
      t.same(context.unwrapErrors(merged), [err1, err2]);
      t.end();
    });

    t.test('#typeIgnoringErrors()', t => {
      t.is(context.errors.length, 2);

      const type = tip.record('Emptiness', {});
      t.is(type.name, 'Emptiness');

      let r = context.typeIgnoringErrors({ k: 'v', l: 'w' }, type);
      t.ok(context.isErrorWrapper(r));
      t.is(context.unwrapErrors(r).message, `${EXTRA_KEY}s "k" and "l"`);

      r = context.typeIgnoringErrors({ k: 'v', l: 'w', m: 'x' }, type);
      t.ok(context.isErrorWrapper(r));
      t.is(context.unwrapErrors(r).message, `${EXTRA_KEY}s "k", "l", and "m"`);

      t.is(context.errors.length, 2);
      t.end();
    });

    t.test('#tallyErrors()', t => {
      let ledger = context.tallyErrors(void 0, wrapper1);
      t.ok(isArray(ledger));
      t.is(ledger.length, 1);
      t.same(ledger[0], context.unwrapErrors(wrapper1));

      ledger = context.tallyErrors(ledger, wrapper2);
      t.is(ledger.length, 2);
      t.is(ledger[1], context.unwrapErrors(wrapper2));
      t.end();
    });

    t.test('#throwError()', t => {
      let error;
      try {
        context.throwError();
      } catch (x) {
        error = x;
      }

      t.ok(error != null);
      t.type(error, TypeError);
      t.type(error.causes, Array);
      t.is(error.causes.length, 2);
      t.type(error.causes[0], TypeError);
      t.type(error.causes[1], TypeError);
      t.end();
    });

    t.end();
  });

  t.test('Typical', t => {
    t.test('.Any()', t => {
      t.is(tip.Any.name, 'Any');
      t.is(tip.Any.meta.name, 'Any');
      t.is(tip.Any.meta.kind, 'base');
      t.is(tip.Any.toString(), '[Typical-Base-Type Any]');

      t.ok(tip.Any.is());
      t.ok(tip.Any.is(null));
      t.ok(tip.Any.is(0));
      t.ok(tip.Any.is(''));

      t.end();
    });

    t.test('.Void()', t => {
      t.is(tip.Void.name, 'Void');
      t.is(tip.Void.meta.name, 'Void');
      t.is(tip.Void.meta.kind, 'base');
      t.is(tip.Void.toString(), '[Typical-Base-Type Void]');

      t.ok(tip.Void.is());
      t.ok(tip.Void.is(null));
      t.notOk(tip.Void.is(0));
      t.notOk(tip.Void.is(''));

      t.end();
    });

    t.test('Boolean()', t => {
      t.is(tip.Boolean.name, 'Boolean');
      t.is(tip.Boolean.meta.name, 'Boolean');
      t.is(tip.Boolean.meta.kind, 'base');
      t.is(tip.Boolean.toString(), '[Typical-Base-Type Boolean]');

      t.notOk(tip.Boolean.is(null));
      t.ok(tip.Boolean.is(false));
      t.ok(tip.Boolean.is(true));

      t.end();
    });

    t.test('.Number()', t => {
      t.is(tip.Number.name, 'Number');
      t.is(tip.Number.meta.name, 'Number');
      t.is(tip.Number.meta.kind, 'base');
      t.is(tip.Number.toString(), '[Typical-Base-Type Number]');

      t.ok(tip.Number.is(0));
      t.ok(tip.Number.is(1));
      t.ok(tip.Number.is(Infinity));
      t.notOk(tip.Number.is(''));
      t.notOk(tip.Number.is([]));

      t.end();
    });

    t.test('.Integer()', t => {
      t.is(tip.Integer.name, 'Integer');
      t.is(tip.Integer.meta.name, 'Integer');
      t.is(tip.Integer.meta.kind, 'refinement');
      t.is(tip.Integer.meta.base, tip.Number);
      t.is(tip.Integer.toString(), '[Typical-Refinement-Type Integer]');

      t.ok(tip.Integer.is(0));
      t.ok(tip.Integer.is(1));
      t.ok(tip.Integer.is(MAX_SAFE_INTEGER));
      t.notOk(tip.Integer.is(MAX_SAFE_INTEGER + 1));
      t.notOk(tip.Integer.is(Infinity));
      t.notOk(tip.Integer.is(''));
      t.notOk(tip.Integer.is([]));

      t.end();
    });

    t.test('.String()', t => {
      t.is(tip.String.name, 'String');
      t.is(tip.String.meta.name, 'String');
      t.is(tip.String.meta.kind, 'base');
      t.is(tip.String.toString(), '[Typical-Base-Type String]');

      t.ok(tip.String.is(''));
      t.ok(tip.String.is('string'));
      t.notOk(tip.String.is(Infinity));
      t.notOk(tip.String.is([]));

      t.end();
    });

    t.test('.URL()', t => {
      t.is(tip.URL.name, 'URL');
      t.is(tip.URL.meta.name, 'URL');
      t.is(tip.URL.meta.kind, 'refinement');
      t.is(tip.URL.meta.base, tip.String);
      t.is(tip.URL.toString(), '[Typical-Refinement-Type URL]');

      t.ok(tip.URL.is('/absolute/path'));
      t.ok(tip.URL.is('relative/path'));
      t.ok(tip.URL.is('https://example.com:665/with/usual/suspects'));
      t.ok(tip.URL.is('email@example.com')); // This works thanks to the base URL.
      t.notOk(tip.URL.is('http://no:no/and/some/path')); // Invalid port number!
      t.notOk(tip.URL.is(Infinity));
      t.notOk(tip.URL.is([]));

      t.end();
    });

    t.test('.Symbol()', t => {
      t.is(tip.Symbol.name, 'Symbol');
      t.is(tip.Symbol.meta.name, 'Symbol');
      t.is(tip.Symbol.meta.kind, 'base');
      t.is(tip.Symbol.toString(), '[Typical-Base-Type Symbol]');

      t.notOk(tip.Symbol.is(''));
      t.notOk(tip.Symbol.is('string'));
      t.notOk(tip.Symbol.is(Infinity));
      t.notOk(tip.Symbol.is([]));

      t.ok(tip.Symbol.is(iterator));
      t.ok(tip.Symbol.is(toStringTag));

      t.end();
    });

    // The above tests more than cover base() and refinement().

    t.test('.option()', t => {
      const type = tip.option(tip.String);

      t.is(type.name, 'StringOption');
      t.is(type.meta.name, 'StringOption');
      t.is(type.meta.kind, 'option');
      t.is(type.meta.base, tip.String);
      t.is(type.toString(), '[Typical-Option-Type StringOption]');

      t.is(type(), void 0);
      t.is(type(null), null);
      t.is(type(''), '');
      t.is(type('hello'), 'hello');
      t.throws(() => type(665));

      t.end();
    });

    t.test('.enum()', t => {
      const type = tip.enum(tip.Integer, 'LuckyNumber', 13, 42, 665);

      t.is(type.name, 'LuckyNumber');
      t.is(type.meta.name, 'LuckyNumber');
      t.is(type.meta.kind, 'enum');
      t.same(type.meta.components, [13, 42, 665]);
      t.is(type.toString(), '[Typical-Enum-Type LuckyNumber]');

      t.is(type(13), 13);
      t.is(type(42), 42);
      t.is(type(665), 665);
      t.throws(() => type(7));

      const not = tip.enum(tip.Number, 'NotANumber', NaN);
      t.is(not.name, 'NotANumber');
      t.is(not.meta.name, 'NotANumber');
      t.is(not.meta.kind, 'enum');

      t.throws(() => not(0));
      t.ok(is(not(NaN), NaN));

      t.end();
    });

    const tip2 = assign({}, tip, {
      recognizeAsArray: tip.NONE_ELEMENT_OR_ARRAY,
      continueAfterError: true,
      ignoreExtraProps: true,
      validateAndCopy: true,
    });

    t.test('.array()', t => {
      // # Test With Variations of recognizeAsArray Option #
      const testcases = [
        { input: 665, when: false },
        { input: [42, 665], when: false },
        { input: ['mark', 665], when: false },
        {
          input: void 0,
          output: [],
          when: ral => ral === tip.NONE_ELEMENT_OR_ARRAY,
        },
        {
          input: null,
          output: [],
          when: ral => ral === tip.NONE_ELEMENT_OR_ARRAY,
        },
        {
          input: 'hello',
          output: ['hello'],
          when: ral => ral !== tip.ARRAY_ONLY,
        },
        { input: [], output: [], when: true },
        { input: ['hello'], output: ['hello'], when: true },
        { input: ['hello', 'world'], output: ['hello', 'world'], when: true },
      ];

      for (const raa of [
        tip.NONE_ELEMENT_OR_ARRAY,
        tip.ELEMENT_OR_ARRAY,
        tip.ARRAY_ONLY,
      ]) {
        const type = tip.array(tip.String, 'StringArray', {
          recognizeAsArray: raa,
        });

        t.is(type.name, 'StringArray');
        t.is(type.meta.name, 'StringArray');
        t.is(type.meta.kind, 'array');
        t.is(type.meta.base, tip.String);
        t.is(type.toString(), '[Typical-Array-Type StringArray]');

        for (const { input, output, when } of testcases) {
          const ok = typeof when === 'function' ? when(raa) : when;

          if (ok) {
            t.ok(type.is(input));
            t.same(type(input), output);
          } else {
            t.notOk(type.is(input));
            t.throws(() => type(input));
          }
        }
      }

      // # Test Variations of Arguments and Options for Full Coverage #
      const NUMBERS = [13, 42, 665];

      let type = tip.array(tip.Number);
      t.is(type.name, 'NumberArray');
      t.ok(type(NUMBERS) === NUMBERS); // Validation only!
      t.notOk(type.is());
      t.notOk(type.is(42));
      t.ok(type.is([42]));

      type = tip.array(tip.Number, {
        recognizeAsArray: tip.NONE_ELEMENT_OR_ARRAY,
      });
      t.is(type.name, 'NumberArray');
      t.ok(type(NUMBERS) === NUMBERS); // Validation only!
      t.same(type(), []);
      t.same(type(42), [42]);
      t.same(type([42]), [42]);

      t.throws(() => tip.array(tip.Number, {}));
      t.throws(() =>
        tip.array(tip.Number, { recognizeAsArray: tip.ARRAY_ONLY }, 'stuff')
      );

      type = tip2.array(tip.Number);
      t.is(type.name, 'NumberArray');
      t.notOk(type(NUMBERS) === NUMBERS); // Validation and Copying!
      t.ok(type.is());
      t.ok(type.is(42));
      t.ok(type.is([42]));

      t.end();
    });

    t.test('.tuple()', t => {
      let count = 0;

      for (const components of [[], [tip.Integer], [tip.String, tip.Integer]]) {
        const name = 'Tuple' + count;
        const type = tip.tuple(name, ...components);
        count++;

        t.is(type.name, name);
        t.is(type.meta.name, name);
        t.is(type.meta.kind, 'tuple');
        t.same(type.meta.components, components);
        t.is(type.toString(), `[Typical-Tuple-Type ${name}]`);

        for (const { valid, value } of [
          { valid: true, value: [] },
          { valid: true, value: [42] },
          { valid: false, value: ['boo'] },
          { valid: true, value: ['lucky', 42] },
          { valid: false, value: [13, 'boo'] },
        ]) {
          t.is(type.is(value), valid && value.length === components.length);
        }
      }

      const Pair = tip2.tuple('Pair', tip2.String, tip2.Integer);
      const data = ['lucky', 42];
      t.ok(Pair.is(data));
      t.ok(Pair(data) !== data);
      t.same(Pair(data), data);

      t.end();
    });

    t.test('.record()', t => {
      const User = tip.record({
        name: tip.String,
        url: tip.option(tip.URL),
      });

      t.is(User.name, 'SomeRecord');
      t.is(User.meta.name, 'SomeRecord');
      t.is(User.meta.kind, 'record');
      t.is(typeof User.meta.components, 'object');
      t.is(User.meta.components.name, tip.String);

      // Third case matters: Record has two fields, just as type, but doesn't type.
      t.ok(User.is({ name: 'John Doe' }));
      t.ok(User.is({ name: 'John Doe', url: 'https://jdoe.com/' }));
      t.notOk(User.is({ name: 'John Doe', age: 42 }));
      t.notOk(User.is({ name: 'John Doe', url: 'https://jdoe.com/', age: 42 }));

      t.notOk(User.is());
      t.notOk(User.is(null));
      t.notOk(User.is(665));

      tip2.ignoreExtraProps = void 0;
      const Article = tip2.record('Article', {
        name: tip2.String,
        url: tip2.URL,
      });

      t.is(Article.name, 'Article');
      t.is(Article.meta.name, 'Article');
      t.is(Article.meta.kind, 'record');
      t.is(Article.meta.components.name, tip2.String);

      const data = {
        name: 'An Article Title',
        url: 'https://example.com/article/',
      };
      t.ok(Article.is(data));

      const article = Article(data);
      t.isNot(article, data);
      t.is(getPrototypeOf(article), Article.prototype);
      t.is(article.name, 'An Article Title');
      t.is(article.url, 'https://example.com/article/');

      let error;
      try {
        Article({ nonsense: 3 });
      } catch (x) {
        error = x;
      }

      t.type(error, TypeError);
      t.ok(isArray(error.causes));
      t.same(error.causes.map(err => err.message), [
        `value "undefined" of property "name" is not of type String`,
        `value "undefined" of property "url" is not of type String`,
        `value has extra key "nonsense"`,
      ]);

      // A few more tests to reach 100% coverage.
      t.throws(() => tip.record({}, {}));

      const tip3 = assign({}, tip, { ignoreExtraProps: true });
      const rec3 = tip3.record({ one: tip3.Integer, two: tip3.URL });
      t.ok(rec3.is({ one: 665, two: 'https://example.com/' }));

      t.end();
    });

    t.end();
  });

  t.end();
});
