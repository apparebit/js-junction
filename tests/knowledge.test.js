/* (c) Copyright 2018 Robert Grimm */

import { addPropertyValue, areEqual, forEachPropertyValue } from '@grr/knowledge/json-ld/values';
import { constant } from '@grr/knowledge/json-ld/util';
import { inverseOf, isSchemaOrgContext } from '@grr/knowledge/semantics/schema-org';
import { join } from 'path';
import { kindOf, isInvalid, isPrimitive, isValue, kindOfObject } from '@grr/knowledge/json-ld/kind';
import Knowledge from '@grr/knowledge';
import parse from '@grr/knowledge/json-ld/parse';
import { promisify } from 'util';
import { readFile as doReadFile } from 'fs';
import State from '@grr/knowledge/json-ld/state';
import { toSiteAndAccount, toUserUrl } from '@grr/knowledge/semantics/social';
import walk from '@grr/knowledge/json-ld/walk';

import { default as harness, testdir } from './harness';

const { defineProperty, getOwnPropertySymbols, keys: keysOf } = Object;
const { isArray } = Array;
const { iterator } = Symbol;
const { parse: parseJSON } = JSON;
const readFile = promisify(doReadFile);

harness.test('@grr/knowledge', t => {
  t.test('json-ld', t => {
    t.test('kind', t => {
      t.ok(isPrimitive(null));
      t.ok(isPrimitive(false));
      t.ok(isPrimitive(665));
      t.ok(isPrimitive('hello'));
      t.notOk(isPrimitive());
      t.notOk(isPrimitive(Symbol('boo')));

      t.ok(isInvalid(void 0));
      t.ok(isInvalid(Symbol('boo')));
      t.notOk(isInvalid({}));
      t.notOk(isInvalid([]));

      t.ok(isValue({ '@value': 665 }));
      t.notOk(isValue({ '@id': 'http://apparebit.com/' }));

      t.is(kindOfObject([]), 'array');
      t.is(kindOfObject({ '@graph': null }), 'graph');
      t.is(kindOfObject({ '@list': [] }), 'list');
      t.is(kindOfObject({ '@set': [] }), 'set');
      t.is(kindOfObject({ '@value': null }), 'value');
      t.is(kindOfObject({ '@id': 'http://apparebit.com/' }), 'reference');
      t.is(kindOfObject({ '@id': 'http://apparebit.com/', '@type': 'WebSite' }), 'node');

      t.is(kindOf(665), 'primitive');
      t.is(kindOf(void 0), 'invalid');

      const ref = { '@id': 'http://apparebit.com/' };
      t.is(kindOf(ref), 'reference');

      // Check for non-enumerable property that is caching kind.
      const sym = getOwnPropertySymbols(ref);
      t.is(sym.length, 1);
      t.is(typeof sym[0], 'symbol');
      t.is(String(sym[0]), 'Symbol(@kind)');

      // Check that kind cache is in fact used by injecting the wrong kind.
      defineProperty(ref, sym[0], constant('array'));
      t.is(kindOf(ref), 'array');

      // Check that obviously invalid kinds are rejected.
      defineProperty(ref, sym[0], constant(665));
      t.is(kindOf(ref), 'reference');

      t.end();
    });

    t.test('values', t => {
      let counter = 0;
      const add1 = () => counter++;

      forEachPropertyValue({ key: 665 }, 'key', add1);
      t.is(counter, 1);
      forEachPropertyValue({ key: [42] }, 'key', add1);
      t.is(counter, 2);
      forEachPropertyValue({ key: [42, 665] }, 'key', add1);
      t.is(counter, 4);

      t.notOk(areEqual(NaN, {}));
      t.notOk(areEqual({}, NaN));
      t.ok(areEqual(NaN, NaN));
      t.notOk(areEqual('value', {}));
      t.notOk(areEqual({}, 'value'));
      t.ok(areEqual('value', 'value'));

      t.notOk(areEqual(void 0, {}));
      t.notOk(areEqual({}, void 0));
      t.notOk(areEqual(void 0, void 0));

      t.notOk(areEqual({ '@value': 665 }, {}));
      t.notOk(areEqual({}, { '@value': 665 }));
      t.notOk(areEqual({ '@value': '665', '@type': 'string'},
        { '@value': '665', '@type': 'number' }));
      t.notOk(areEqual({ '@value': '665', '@type': 'string', '@language': '??' },
        { '@value': '665', '@type': 'string', '@language': 'en' }));
      t.ok(areEqual({ '@value': '665', '@type': 'string', '@language': 'en' },
        { '@value': '665', '@type': 'string', '@language': 'en' }));
      t.notOk(areEqual({}, ));

      t.notOk(areEqual({ '@id': 'http://example.com/n1' }, {}));
      t.notOk(areEqual({}, { '@id': 'http://example.com/n1' }));
      t.notOk(areEqual({ '@id': 'http://example.com/n1' }, { '@id': 'http://example.com/n2' }));
      t.ok(areEqual({ '@id': 'http://example.com/n' }, { '@id': 'http://example.com/n' }));
      t.ok(areEqual({ '@id': 'http://example.com/n' },
        { '@id': 'http://example.com/n', 'key': 'value' }));

      t.throws(() => addPropertyValue({ '@id': 'http://example.com/node.js' }, 'key', 'value'));
      t.throws(() => addPropertyValue({}, 665, 'value'));
      t.throws(() => addPropertyValue({}, 'key', { '@id': 665 }));
      t.throws(() => addPropertyValue({}, 'key', { '@id': '_:blank' }));
      t.throws(() => addPropertyValue({}, 'key', { '@value': {} }));
      t.throws(() => addPropertyValue({}, 'key', { '@list': [1, 2, 3] }));

      const node = {
        prop2: 665,
        prop3: 42,
        prop4: [42],
        prop5: [42, 665],
        prop6: [42],
        prop7: 42,
        prop8: 42,
      };

      for( let index = 1; index <= 5; index++ ) {
        addPropertyValue(node, `prop${index}`, 665);
      }

      addPropertyValue(node, 'prop6', { '@value': 665 });
      addPropertyValue(node, 'prop7', { '@value': 665, '@type': 'integer' });
      addPropertyValue(node, 'prop8', { '@id': 'http://example.com/node.js' });

      t.is(node.prop1, 665);
      t.is(node.prop2, 665);
      t.same(node.prop3, [42, 665]);
      t.same(node.prop4, [42, 665]);
      t.same(node.prop5, [42, 665]);
      t.same(node.prop6, [42, 665]);
      t.same(node.prop7, [42, { '@value': 665, '@type': 'integer' }]);
      t.same(node.prop8, [42, { '@id': 'http://example.com/node.js' }]);

      t.end();
    });

    t.test('state', t => {
      const state = new State();
      state.ancestors = [
        { key: null },
        { key: 42 },
        { key: 'προπ' },
        { key: '@set' }
      ];

      // State.quote(), State.asElements(), and State.asValue() are tested in `err.test.js`.
      t.is(State.asPath(state), `[42]['προπ']['@set']`);

      t.notOk(state.hasDiagnostics());
      t.notOk(state.hasDiagnostics(13));
      t.ok(state.hasDiagnostics(0));

      state.emitBadValue('is bad, duh!');
      t.ok(state.hasDiagnostics());
      t.ok(state.hasDiagnostics(1));
      t.notOk(state.hasDiagnostics(0));

      t.notOk(state.isRoot());
      state.ancestors = [{}];
      t.ok(state.isRoot());
      state.ancestors = [{ kind: 'array' }, {}];
      t.ok(state.isRoot());

      t.end();
    });

    t.test('walk', t => {
      // Check walk()'s corner cases: The state doesn't have `ancestors`.
      t.same(walk(null, { state: {} }).ancestors, []);

      // The state has no parent.
      walk({ prop: 1, props: 'n' }, { handlers: {
        node(value, state) {
          t.is(state.ancestors.length, 1);
          t.same(state.parent, {});
        }
      } });

      // The machinery for tracing handlers as they are invoked.
      const trace = [];
      const handlers = {
        secret: 42,

        array() {
          // Make sure walk() invokes handlers as methods not functions.
          t.is(this.secret, 42);
          trace.push('array');
        },

        graph() { trace.push('graph'); },
        invalid() { trace.push('invalid'); },
        list() { trace.push('list'); },
        node() { trace.push('node'); },
        primitive() { trace.push('primitive'); },
        reference() { trace.push('reference'); },
        reverse() { trace.push('reverse'); },
        set() { trace.push('set'); },
        value() { trace.push('value'); },
      };
      const base = (value, state) =>
        trace.push(state.ancestors[state.ancestors.length - 1].kind);

      // The actual graph.
      const graph = [
        { '@graph': 'yo' },
        { '@list': [1] },
        { '@set': [true, false] },
        { '@value': null },
        { '@id': 'http://apparebit.com/' },
        { '@id': 'http://apparebit.com/', '@type': 'WebSite', 'sad': Symbol('boo') },
        { '@reverse': { forward: { '@id': 'http://whiplash.com/' } } },
      ];

      // Check that a walk() handled all the right values in the right order.
      const checkWalk = () => t.same(trace, [
        'primitive', 'graph',
        'primitive', 'array', 'list',
        'primitive', 'primitive', 'array', 'set',
        'primitive', 'value',
        'reference',
        'primitive', 'primitive', 'invalid', 'node',
        'reference', 'reverse', 'node',
        'array',
      ]);

      // Walk with individual handlers.
      walk(graph, { handlers });
      checkWalk();

      // Walk with a single base handler.
      trace.length = 0;
      walk(graph, { base });
      checkWalk();

      // Walk without being noticed.
      trace.length = 0;
      walk(graph);
      t.same(trace, []);

      t.end();
    });

    t.test('parse', t => {
      const knowledge = {
        nodes: { 'http://example.com/conflict1': {} },

        has: function has(id) { return id in this.nodes; },
        get: function get(id) { return this.nodes[id]; },
        add: function add(node) { this.nodes[node['@id']] = node; }
      };

      // Check validation of context and root nodes.
      const state = parse(null, knowledge)           // Not an object, case #1: null.
        .parse(665)                                  // Not an object, case #2: truthy value.
        .parse([])                                   // Not an object, case #3: array.
        .parse({                                     // Not Schema.org context but with @id.
          '@context': 'http://xmlns.com/foaf/0.1/',
          '@id': 'http://example.com/'
        })
        .parse({ '@graph': [], 'key': 'value' });    // Both node object and @graph.

      t.is(state.diagnostics.length, 5);

      [
        'a JSON-LD document must have a JSON object as content',
        'a JSON-LD document must have a JSON object as content',
        'a JSON-LD document must have a JSON object, not an array, as content',
        '@grr/knowledge requires @context to be based on Schema.org,\n'
          + 'with either @context or @vocab being "http://schema.org/"',
        'a JSON-LD document cannot have both a root node and a @graph of nodes'
      ].forEach((expected, index) => t.is(state.diagnostics[index].message, expected));

      state.nodes = { 'http://example.com/conflict2': {} };
      state.diagnostics.length = 0;
      state.parse({
        '@context': 'http://schema.org/',
        '@graph': [
          {                                              // 🚫 Root node without @id.
            invalid: Symbol('boo')                       // 🚫 Invalid property value.
          },
          {
            '@id': 'http://example.com/node1',
            'prop1': 'val1',
            'prop2': 'val2',
            'nested': {                                  // ⚠️ Preserve nested node without @id.
              prop3: 'val3',
              prop4: 'val4',
              prop5: {                                   // ⚠️ Preserve @value with @type.
                '@value': 665,
                '@type': 'integer'
              }
            },
            'also-nested': {                             // ⚠️ Hoist nested node with @id.
              '@id': 'http://example.com/nested/node1',
              'prop6': 'val6',
              'prop7': 'val7',
              'prop8': {                                 // ⚠️ Desugar superfluous @value.
                '@value': 665
              }
            },
            'contextual': {
              '@context': 'http://example.com/context',  // 🚫 Unsupported nested context.
              'prop9': 'val9',
              'prop0': 'val0',
              'ooh': [
                'text',
                { zoo: 'monkey', loo: 'crocodile' },
                { '@set': [1, 2, 3] },                  // ⚠️ Desugar superfluous @set.
                { '@set': 665 },                        // ⚠️ Desugar superfluous @set.
                ['I', 'am', 'bad']                      // 🚫 Array within array.
              ]
            },
            'graphic': {
              '@graph': 'data'                          // 🚫 Nested @graph.
            },
            '@reverse': {
              url: 'http://example.com/node42',         // ⚠️ Convert to reference.
              ref: {
                '@id': 'http://example.com/node42'
              },
              node: {                                   // 🚫 Node has @reverse but no @id.
                'p1': 'v1',
                'p2': 'v2',
                '@reverse': 665,                        // 🚫 Invalid value for @reverse.
              },
              badURL: 'node665',                        // 🚫 Bad URL for @reverse property value.
            }
          },
          {
            '@id': 'http://example.com/conflict1',      // 🚫 @id already exists in knowledge base.
            'prop': 'val'
          },
          {
            '@id': 'http://example.com/conflict2',      // 🚫 @id already exists in parsed state.
            'prop': 'val'
          },
          {
            '@id': 665,                                 // 🚫 Invalid @id value.
            'prop': 'val'
          },
          {
            '@id': '_:blank',                           // 🚫 Unsupported blank node identifier.
            'prop': 'val'
          },
          {
            '@value': 42,
            '@reverse': 'drawrof'                       // 🚫 Invalid property for @value object.
          },
          {
            '@value': 42,
            '@reverse': 'drawrof',                      // 🚫 Invalid property for @value object.
            '@vocab': 'blah blah blah'                  // 🚫 Invalid property or @value object.
          },
          {
            '@value': {},                               // 🚫 Invalid value for @value object.
            '@type': 'Object'
          },
          {
            '@value': 665                               // 🚫 @value object as document root.
          },
          {                                             // 🚫 @list object as document root.
            '@list': [{ '@list': 0 }, { '@set': 0 }]    // 🚫 @list with nested @list and @set.
          }
        ]
      });

      state.parse({ '@id': 'http://example.com/node42', 'prop': 'val' });
      state.parse({ '@list': NaN });                    // 🚫 @list object as document root.
      state.parse({ '@set': NaN });                     // 🚫 @set object as document root.
      state.parse({ '@value': NaN });                   // 🚫 @value object as document root.

      t.is(state.diagnostics.length, 24);  // The number of errors above.
      t.is(keysOf(state.nodes).length, 6); // The number of nodes in primary index.

      // >>> Positive reinforcement: Check node properties.
      const node1 = state.nodes['http://example.com/node1'];

      // Nested node without @id and @value with @type are preserved in place.
      t.is(keysOf(node1.nested).length, 3);
      t.same(node1.nested.prop5, { '@value': 665, '@type': 'integer' });

      // Nested node with @id is hoisted and superfluous @value is desugared.
      t.same(node1['also-nested'], { '@id': 'http://example.com/nested/node1' });
      t.is(state.nodes['http://example.com/nested/node1'].prop8, 665);

      // Superfluous @set is desugared.
      const { ooh } = node1.contextual;
      t.ok(isArray(ooh));
      t.is(ooh.length, 7);
      t.same(ooh, [
        'text',
        { zoo: 'monkey', loo: 'crocodile' },
        1,
        2,
        3,
        665,
        ['I', 'am', 'bad']  // See 3rd error message below.
      ]);

      // Plain text URL has been replaced with equivalent reference.
      t.same(node1['@reverse'].url, { '@id': 'http://example.com/node42' });

      // >>> Negative reinforcement: Check error messages.
      [
        `JSON-LD data at path "['@graph'][0]['invalid']" has value "Symbol(boo)", `
          + `which is not supported by JSON-LD`,
        `JSON-LD data at path "['@graph'][0]" is a root node without @id`,
        `JSON-LD data at path "['@graph'][1]['contextual']['ooh']" is array with invalid value `
          + `"[ 'I', 'am', 'bad' ]",\nwhich should be null, a boolean, number, string, `
          + `@value, @set, @list, reference, or node`,
        `JSON-LD data at path "['@graph'][1]['contextual']" includes nested @context `
          + `unsupported by @grr/knowledge`,
        `JSON-LD data at path "['@graph'][1]['graphic']" includes nested @graph `
          + `unsupported by @grr/knowledge`,
        `JSON-LD data at path "['@graph'][1]['@reverse']['node']['@reverse']" `
          + `is the @reverse property of a node without @id`,
        `JSON-LD data at path "['@graph'][1]['@reverse']['node']['@reverse']" `
          + `is a value other than an object`,
        `JSON-LD data at path "['@graph'][1]['@reverse']['badURL']" `
          + `is @reverse property value "'node665'" but should be a node, reference, or URL`,
        `JSON-LD data at path "['@graph'][2]" is duplicate of node with `
          + `@id "http://example.com/conflict1" in knowledge base`,
        `JSON-LD data at path "['@graph'][3]" is duplicate of node with `
          + `@id "http://example.com/conflict2" in same document`,
        `JSON-LD data at path "['@graph'][4]" has @id "665", which is not an IRI`,
        `JSON-LD data at path "['@graph'][5]" has blank node identifier "_:blank" `
          + `unsupported by @grr/knowledge`,
        `JSON-LD data at path "['@graph'][6]" is a @value object with superfluous key "@reverse"`,
        `JSON-LD data at path "['@graph'][6]" places @value at root`,
        `JSON-LD data at path "['@graph'][7]" is a @value object with superfluous keys "@reverse" `
          + `and "@vocab"`,
        `JSON-LD data at path "['@graph'][7]" places @value at root`,
        `JSON-LD data at path "['@graph'][8]" is invalid @value "{}", which is neither null, `
          + `a boolean, a number, or a string`,
        `JSON-LD data at path "['@graph'][8]" places @value at root`,
        `JSON-LD data at path "['@graph'][9]" places @value at root`,
        `JSON-LD data at path "['@graph'][10]" is @list with invalid value "{ '@list': 0 }",\n`
          + `which should be null, a boolean, number, string, @value, reference, or node`,
        `JSON-LD data at path "['@graph'][10]" places @list at root`,
        `JSON-LD document places @list at root`,
        `JSON-LD document places @set at root`,
        `JSON-LD document places @value at root`
      ].forEach((expected, index) => t.is(state.diagnostics[index].message, expected));

      t.throws(() => state.throwOnFailure());
      t.is(keysOf(knowledge.nodes).length, 1);
      state.transferOnSuccess();
      t.is(keysOf(knowledge.nodes).length, 1);

      state.diagnostics = [];
      t.doesNotThrow(() => state.throwOnFailure());
      t.is(keysOf(knowledge.nodes).length, 1);
      state.transferOnSuccess();
      t.is(keysOf(knowledge.nodes).length, 7);

      t.end();
    });

    t.end();
  });

  t.test('semantics', t => {
    t.test('schema-org', t => {
      t.ok(isSchemaOrgContext('http://schema.org'));
      t.ok(isSchemaOrgContext('http://schema.org/'));
      t.ok(isSchemaOrgContext({ '@vocab': 'http://schema.org/' }));

      t.notOk(isSchemaOrgContext('http://xmlns.com/foaf/0.1/'));
      t.notOk(isSchemaOrgContext({ '@vocab': 'http://schema.org' }));
      t.notOk(isSchemaOrgContext({ '@vocab': 'http://xmlns.com/foaf/0.1/' }));

      t.is(inverseOf('hasPart'), 'isPartOf');
      t.is(inverseOf(inverseOf('hasPart')), 'hasPart');
      t.is(inverseOf('exceedinglyUnlikelySchemaDotOrgPropertyName'), void 0);

      t.end();
    });

    t.test('social', t => {
      // Why two slashes? One is chopped off before matching and the other is
      // needed for matching, which yields an empty, then rejected account.
      t.is(toSiteAndAccount('https://www.facebook.com//'), null);

      t.is(toSiteAndAccount('https://www.myspace.com/apparebit'), null); // Oops!

      t.same(toSiteAndAccount('https://www.facebook.com/apparebit'),
        { site: 'facebook', account: 'apparebit' });
      t.same(toSiteAndAccount('https://www.facebook.com/apparebit/'),
        { site: 'facebook', account: 'apparebit' });

      t.same(toSiteAndAccount('https://developers.facebook.com/apps/12345678'),
        { site: 'fbAppId', account: '12345678' });
      t.same(toSiteAndAccount('https://github.com/apparebit'),
        { site: 'github', account: 'apparebit' });
      t.same(toSiteAndAccount('https://www.linkedin.com/in/apparebit'),
        { site: 'linkedin', account: 'apparebit' });
      t.same(toSiteAndAccount('https://www.npmjs.com/~grr'),
        { site: 'npm', account: 'grr'});
      t.same(toSiteAndAccount('https://twitter.com/apparebit'),
        { site: 'twitter', account: 'apparebit' });
      t.is(toUserUrl('facebook', 'apparebit'), 'https://www.facebook.com/apparebit');

      t.end();
    });

    t.end();
  });

  t.test('Knowledge', async function test(t) {
    // >>> Check ingestion of a non-trivial JSON-LD document.
    const file = join(testdir, '..', 'packages', 'apparebit-com', 'site.jsonld');
    const json = await readFile(file, 'utf8').then(parseJSON);

    const corpus = new Knowledge();
    t.doesNotThrow(() => corpus.ingest(json));

    // >>> Check the rough outline of the expected graph.
    t.ok(corpus.has('https://apparebit.com'));
    t.ok(corpus.has('https://apparebit.com/#website'));
    t.ok(corpus.has('https://apparebit.com/blog'));
    t.ok(corpus.has('https://apparebit.com/robert-grimm'));
    t.ok(corpus.has('https://apparebit.com/robert-grimm#self'));
    t.ok(corpus.has('https://apparebit.com/about/site'));
    t.ok(corpus.has('https://apparebit.com/about/privacy'));
    t.ok(corpus.has('https://apparebit.com/project/ubu-trump'));
    t.ok(corpus.has('https://apparebit.com/project/candy-or-bust'));
    t.ok(corpus.has('https://github.com/apparebit/js-junction'));

    // >>> Check adding nodes and properties.
    t.throws(() => corpus.add({ '@set': 665 }));
    t.throws(() => corpus.add({ prop1: 'val1', prop2: 'val2' }));
    t.throws(() => corpus.add({ '@id': 'https://apparebit.com', 'prop1': 'val1' }));

    t.notOk(corpus.has('https://apparebit.com/library/form.css'));
    corpus.add({
      '@id': 'https://apparebit.com/library/form.css',
      '@type': 'DigitalDocument',
    });
    t.ok(corpus.has('https://apparebit.com/library/form.css'));

    const form = corpus.get('https://apparebit.com/library/form.css');
    t.notOk('fileFormat' in form);
    corpus.addPropertyValue(form, 'fileFormat', 'text/css');
    t.is(form.fileFormat, 'text/css');

    // >>> Check the iterators.
    const iter1 = corpus.values();
    const iter2 = corpus[iterator]();

    while( true ) {
      const { value: v1, done: done1 } = iter1.next();
      const { value: v2, done: done2 } = iter2.next();

      t.is(v1, v2);
      t.is(done1, done2);
      if( done1 || done2 ) break;
    }

    for( const [id, node] of corpus.entries() ) {
      t.is(node['@id'], id);
    }

    // >>> Check value resolution, which surfaces values over metadata.
    const tokyo = { '@id': 'http://www.metro.tokyo.jp' };
    t.is(corpus.resolve(tokyo), tokyo);
    t.is(corpus.resolve({ '@list': 42 }), 42);
    t.is(corpus.resolve({ '@set': 665 }), 665);
    t.is(corpus.resolve({ '@value': 13 }), 13);

    const ubu = corpus.get('https://apparebit.com/project/ubu-trump');
    t.is(ubu['@id'], 'https://apparebit.com/project/ubu-trump');
    t.is(ubu['@type'], 'WebPage');
    t.is(ubu.mainEntity['@type'], 'Article');
    t.is(ubu.mainEntity.headline, 'Ubu Trump? Trump Roi!');

    // >>> Check linking of reverse and inverse properties.
    t.is(ubu.mainEntity.mainEntityOfPage, void 0);
    corpus.link();
    t.same(ubu.mainEntity.mainEntityOfPage, { '@id': 'https://apparebit.com/project/ubu-trump' });

    const center = {
      '@id': 'http://example.com/center',
      'payload': 42,
      'nested': {
        '@reverse': {
          porp: { '@id': 'http://example.com/offchart' },
        }
      },
      '@reverse': {
        one: {
          payload: 11,
        },
        two: [
          {
            payload: 242,
          },
          {
            payload: 484,
          }
        ],
        three: { '@id': 'http://example.com/offchart' },
      }
    };

    new Knowledge().add(center).link();
    t.is(center['@reverse'].one.one['@id'], 'http://example.com/center');
    t.is(center['@reverse'].two[0].two['@id'], 'http://example.com/center');
    t.is(center['@reverse'].two[1].two['@id'], 'http://example.com/center');

    t.same(center['@reverse'].three, { '@id': 'http://example.com/offchart' });

    t.end();
  });

  t.end();
});
