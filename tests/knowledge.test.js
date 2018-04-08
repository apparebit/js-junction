/* (c) Copyright 2018 Robert Grimm */

import Knowledge from '@grr/knowledge';
import { default as harness, testdir } from './harness';
import { isSchemaOrgContext } from '@grr/knowledge/semantics/schema-org';
import { join } from 'path';
import { promisify } from 'util';
import { readFile as doReadFile } from 'fs';

const { parse: parseJSON } = JSON;
const readFile = promisify(doReadFile);
const { toContext } = Knowledge;

harness.test('@grr/knowledge', async function test(t) {
  const corpus = new Knowledge('http://schema.org');

  t.test('Knowledge()', t => {
    t.is(corpus.context, 'http://schema.org/');

    t.ok(isSchemaOrgContext('http://schema.org/'));
    t.notOk(isSchemaOrgContext('http://schema.org'));
    t.ok(isSchemaOrgContext(toContext('http://schema.org')));
    t.notOk(isSchemaOrgContext('http://xmlns.com/foaf/0.1/'));

    t.end();
  });

  const path = join(testdir, '..', 'packages', 'apparebit-com', 'site.jsonld');
  const json = await readFile(path, 'utf8').then(parseJSON);

  t.test('.parse()', t => {
    t.doesNotThrow(() => corpus.parse(json));
    t.ok(corpus.has('https://apparebit.com/robert-grimm#self'));

    const self = corpus.get('https://apparebit.com/robert-grimm#self');
    t.is(self.name, 'Robert Grimm');

    t.end();
  });

  t.end();
});
