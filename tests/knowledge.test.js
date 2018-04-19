/* (c) Copyright 2018 Robert Grimm */

import * as Values from '@grr/knowledge/json-ld/values';
import { default as harness } from './harness';

harness.test('@grr/knowledge', t => {
  t.test('jsonld', t => {
    t.test('values', t => {
      t.ok(Values.isPrimitive(null));
      t.ok(Values.isPrimitive(false));
      t.ok(Values.isPrimitive(665));
      t.ok(Values.isPrimitive('hello'));
      t.notOk(Values.isPrimitive());
      t.notOk(Values.isPrimitive(Symbol('boo')));

      t.ok(Values.isObject({}));
      t.notOk(Values.isObject(null));
      t.notOk(Values.isObject(665));
      t.notOk(Values.isObject([]));

      t.ok(Values.isGraph({ '@graph': null }));
      t.notOk(Values.isGraph({ '@id': null }));

      t.ok(Values.isList({ '@list': null }));
      t.notOk(Values.isList({ '@id': null }));

      t.ok(Values.isSet({ '@set': null }));
      t.notOk(Values.isSet({ '@id': null }));

      t.ok(Values.isValue({ '@value': null }));
      t.notOk(Values.isValue({ '@id': null }));

      t.ok(Values.isListOrSet({ '@list': null }));
      t.ok(Values.isListOrSet({ '@set': null }));
      t.notOk(Values.isListOrSet({ '@id': null }));

      t.ok(Values.isReference({ '@id': 'http://apparebit.com/' }));
      t.notOk(Values.isReference({ '@id': 'http://apparebit.com/', '@type': 'WebSite' }));

      t.ok(Values.isBlankNodeId('_:n665'));
      t.notOk(Values.isBlankNodeId('http://schema.org/'));

      t.ok(Values.hasProperty({ key: 665 }, 'key'));
      t.ok(Values.hasProperty({ key: [665] }, 'key'));
      t.notOk(Values.hasProperty({}, 'key'));
      t.notOk(Values.hasProperty({ key: null }, 'key'));
      t.notOk(Values.hasProperty({ key: [] }, 'key'));

      t.ok(Values.areEqual(665, 665));
      t.ok(Values.areEqual(NaN, NaN));
      t.ok(Values.areEqual({ '@value': 665 }, { '@value': 665 }));
      t.ok(Values.areEqual(
        { '@id': 'http://apparebit.com/' },
        { '@id': 'http://apparebit.com/', '@type': 'WebSite' }));
      t.notOk(Values.areEqual(665, NaN));
      t.notOk(Values.areEqual(Symbol('boo'), {}));
      t.notOk(Values.areEqual({}, Symbol('booboo')));
      t.notOk(Values.areEqual(
        { '@value': 665 },
        { '@value': 42 }));
      t.notOk(Values.areEqual(
        { '@value': 665, '@type': 'int' },
        { '@value': 665, '@type': 'int32' }));
      t.notOk(Values.areEqual(
        { '@value': 'boo', '@type': 'string', '@language': 'en' },
        { '@value': 'boo', '@type': 'string', '@language': 'en_US' }));
      t.notOk(Values.areEqual(
        { '@id': 665 },
        { '@id': 'http://apparebit.com/' }));
      t.notOk(Values.areEqual(
        { '@id': 'http://apparebit.com/blog' },
        { '@id': 'http://apparebit.com/' }));

      t.end();
    });

    t.end();
  });

  t.end();
});
