/* (c) Copyright 2018 Robert Grimm */

import tip from '@grr/typical';
import harness from './harness';
import { isArray } from 'util';

const { assign, getOwnPropertySymbols, getPrototypeOf, is } = Object;
const { iterator, toStringTag } = Symbol;
const { MAX_SAFE_INTEGER } = Number;

export default harness(__filename, t => {
  t.test('Context', t => {
    t.test('.isRequired()', t => {
      t.ok(tip.Context.isRequired());
      t.ok(tip.Context.isRequired(null));
      t.ok(tip.Context.isRequired({ [Symbol('context')]: true }));
      t.notOk(tip.Context.isRequired(new tip.Context()));
      t.end();
    });

    t.test('.mergeConfig()', t => {
      t.same(
        tip.Context.mergeConfig(
          { label: 'primary', shadow: false, first: 1, second: void 0 },
          { label: 'secondary', shadow: true, second: 2 }
        ),
        { label: 'primary', shadow: false, first: 1, second: 2 }
      );
      t.end();
    });

    const context = new tip.Context();
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
      t.is(tip.Any.kind, 'base');
      t.is(tip.Any.combinator, tip.base);
      t.is(tip.Any.toString(), '[typical-base-type Any]');

      t.ok(tip.Any.is());
      t.ok(tip.Any.is(null));
      t.ok(tip.Any.is(0));
      t.ok(tip.Any.is(''));

      t.end();
    });

    t.test('.Void()', t => {
      t.is(tip.Void.name, 'Void');
      t.is(tip.Void.kind, 'base');
      t.is(tip.Void.combinator, tip.base);
      t.is(tip.Void.toString(), '[typical-base-type Void]');

      t.ok(tip.Void.is());
      t.ok(tip.Void.is(null));
      t.notOk(tip.Void.is(0));
      t.notOk(tip.Void.is(''));

      t.end();
    });

    t.test('Boolean()', t => {
      t.is(tip.Boolean.name, 'Boolean');
      t.is(tip.Boolean.kind, 'base');
      t.is(tip.Boolean.combinator, tip.base);
      t.is(tip.Boolean.toString(), '[typical-base-type Boolean]');

      t.notOk(tip.Boolean.is(null));
      t.ok(tip.Boolean.is(false));
      t.ok(tip.Boolean.is(true));

      t.end();
    });

    t.test('.Number()', t => {
      t.is(tip.Number.name, 'Number');
      t.is(tip.Number.kind, 'base');
      t.is(tip.Number.combinator, tip.base);
      t.is(tip.Number.toString(), '[typical-base-type Number]');

      t.ok(tip.Number.is(0));
      t.ok(tip.Number.is(1));
      t.ok(tip.Number.is(Infinity));
      t.notOk(tip.Number.is(''));
      t.notOk(tip.Number.is([]));

      t.end();
    });

    t.test('.Integer()', t => {
      t.is(tip.Integer.name, 'Integer');
      t.is(tip.Integer.kind, 'refinement');
      t.is(tip.Integer.combinator, tip.refinement);
      t.is(tip.Integer.terms[0], tip.Number);
      t.is(tip.Integer.toString(), '[typical-refinement-type Integer]');

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
      t.is(tip.String.kind, 'base');
      t.is(tip.String.combinator, tip.base);
      t.is(tip.String.toString(), '[typical-base-type String]');

      t.ok(tip.String.is(''));
      t.ok(tip.String.is('string'));
      t.notOk(tip.String.is(Infinity));
      t.notOk(tip.String.is([]));

      t.end();
    });

    t.test('.URL()', t => {
      t.is(tip.URL.name, 'URL');
      t.is(tip.URL.kind, 'refinement');
      t.is(tip.URL.combinator, tip.refinement);
      t.is(tip.URL.terms[0], tip.String);
      t.is(tip.URL.toString(), '[typical-refinement-type URL]');

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
      t.is(tip.Symbol.kind, 'base');
      t.is(tip.Symbol.combinator, tip.base);
      t.is(tip.Symbol.toString(), '[typical-base-type Symbol]');

      t.notOk(tip.Symbol.is(''));
      t.notOk(tip.Symbol.is('string'));
      t.notOk(tip.Symbol.is(Infinity));
      t.notOk(tip.Symbol.is([]));

      t.ok(tip.Symbol.is(iterator));
      t.ok(tip.Symbol.is(toStringTag));

      t.end();
    });

    t.test('.base()', t => {
      const reject = () => false;
      const type = tip.base(reject);

      t.is(type.name, 'reject');
      t.is(type.combinator, tip.base);
      t.end();
    });

    t.test('.refinement()', t => {
      const type = tip.refinement(tip.Void, v => v === void 0);

      t.is(type.name, 'VoidRefinement');
      t.is(type.combinator, tip.refinement);
      t.end();
    });

    t.test('.option()', t => {
      let type = tip.option(tip.String);

      t.is(type.name, 'StringOption');
      t.is(type.kind, 'option');
      t.is(type.combinator, tip.option);
      t.is(type.terms[0], tip.String);
      t.is(type.toString(), '[typical-option-type StringOption]');

      t.is(type(), void 0);
      t.is(type(null), null);
      t.is(type(''), '');
      t.is(type('hello'), 'hello');
      t.throws(() => type(665));

      type = tip.option('OptionalText', tip.String);

      t.is(type.name, 'OptionalText');
      t.is(type.kind, 'option');
      t.is(type.combinator, tip.option);

      t.end();
    });

    t.test('.enum()', t => {
      let type = tip.enum('LuckyNumber', tip.Integer, 13, 42, 665);

      t.is(type.name, 'LuckyNumber');
      t.is(type.kind, 'enum');
      t.same(type.terms, [tip.Integer, 13, 42, 665]);
      t.is(type.toString(), '[typical-enum-type LuckyNumber]');

      t.is(type(13), 13);
      t.is(type(42), 42);
      t.is(type(665), 665);
      t.throws(() => type(7));

      type = tip.enum(tip.Integer, 13, 42);

      t.is(type.name, 'SomeIntegerEnum');
      t.is(type.kind, 'enum');
      t.same(type.terms, [tip.Integer, 13, 42]);

      const not = tip.enum('NotANumber', tip.Number, NaN);
      t.is(not.name, 'NotANumber');
      t.is(not.kind, 'enum');

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
        const type = tip.array('StringArray', tip.String, {
          recognizeAsArray: raa,
        });

        t.is(type.name, 'StringArray');
        t.is(type.kind, 'array');
        t.is(type.combinator, tip.array);
        t.same(type.terms, [tip.String]);
        t.is(type.toString(), '[typical-array-type StringArray]');

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

      t.doesNotThrow(() => tip.array(tip.Number, {}));
      t.doesNotThrow(() =>
        tip.array(
          tip.Number,
          { recognizeAsArray: tip.ARRAY_ONLY },
          'ignored-stuff'
        )
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
        t.is(type.kind, 'tuple');
        t.is(type.combinator, tip.tuple);
        t.same(type.terms, components);
        t.is(type.toString(), `[typical-tuple-type ${name}]`);

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

      const VoidPair = tip2.tuple(tip2.Void, tip2.Void);
      t.is(VoidPair.name, 'Some2Tuple');
      t.is(VoidPair.kind, 'tuple');
      t.same(VoidPair.terms, [tip2.Void, tip2.Void]);

      t.end();
    });

    t.test('.record()', t => {
      const components = {
        name: tip.String,
        url: tip.option(tip.URL),
      };
      const User = tip.record(components);

      t.is(User.name, 'SomeRecord');
      t.is(User.kind, 'record');
      t.is(User.combinator, tip.record);
      t.same(User.terms, [components]);
      t.is(User.terms[0].name, tip.String);

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
      t.is(Article.kind, 'record');
      t.is(Article.combinator, tip.record);
      t.is(Article.terms[0].name, tip2.String);

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
      t.doesNotThrow(() => tip.record({}, {}));

      const tip3 = assign({}, tip, { ignoreExtraProps: true });
      const rec3 = tip3.record({ one: tip3.Integer, two: tip3.URL });
      t.ok(rec3.is({ one: 665, two: 'https://example.com/' }));

      t.end();
    });

    t.end();
  });

  t.end();
});
