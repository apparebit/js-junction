/* (c) Copyright 2018 Robert Grimm */

import {
  manifest,
  originalToInstrumented,
  packages,
  updateDependency,
} from '@grr/inventory';

import { EOL } from 'os';
import harness from './harness';
import { promisify } from 'util';
import { resolve } from 'path';
import { readFile as doReadFile } from 'fs';

const { isArray } = Array;
const { keys: keysOf } = Object;
const { parse: parseJSON } = JSON;
const readFile = promisify(doReadFile);

export default harness(__filename, t => {
  const root = resolve(__dirname, '..');
  const pkgdir = resolve(root, 'packages');

  function checkMainManifest(t, path, text, data) {
    t.is(path, root);
    t.ok(text.startsWith('{\n  "name": "js-junction",\n  "private": true,\n'));
    t.is(data.name, 'js-junction');
    t.is(data.author, 'Robert Grimm');
  }

  t.test('manifest()', async function test(t) {
    await t.rejects(manifest({ start: resolve(root, '..') }), {
      code: 'ERR_RESOURCE_NOT_FOUND',
    });

    const { path, text, data } = await manifest();
    checkMainManifest(t, path, text, data);
    t.end();
  });

  t.test('packages()', async function test(t) {
    {
      const { path, text, data, pkgs } = await packages();

      checkMainManifest(t, path, text, data);
      t.is(pkgs.length, 6);
      t.ok(pkgs.includes(resolve(pkgdir, 'err')));
      t.ok(pkgs.includes(resolve(pkgdir, 'inventory')));
      t.ok(pkgs.includes(resolve(pkgdir, 'knowledge')));
      t.ok(pkgs.includes(resolve(pkgdir, 'mark-of-dev')));
      t.ok(pkgs.includes(resolve(pkgdir, 'oddjob')));
      t.ok(pkgs.includes(resolve(pkgdir, 'proact')));
    }

    {
      const { path, text, data, pkgs } = await packages({
        start: resolve(pkgdir, 'proact', 'html')
      });

      t.is(path, resolve(pkgdir, 'proact'));
      t.ok(text.startsWith('{\n  "name": "@grr/proact",\n  '
        + '"description": "Making server-side rendering great again!",'));
      t.is(data.name, '@grr/proact');
      t.is(data.description, 'Making server-side rendering great again!');
      t.is(pkgs, void 0);
    }

    t.end();
  });

  const fixtures = resolve(__dirname, 'fixtures');
  const gear = resolve(fixtures, 'package.json');
  const cog = resolve(fixtures, 'packages', 'cog', 'package.json');
  const CLICKETY = 'clickety-clack';

  t.test('updateDependency()', async function test(t) {
    await t.rejects(updateDependency('clap-clap', '4.2.0', { start: cog }));

    const parseFile = async function(path) {
      return parseJSON(await readFile(path, 'utf8'));
    };

    const checkManifests = async function() {
      const gear0 = await parseFile(gear);
      const cog0 = await parseFile(cog);

      t.is(gear0.peerDependencies[CLICKETY], '0.4.2');
      t.is(gear0.devDependencies[CLICKETY], '0.4.2');
      t.is(cog0.dependencies[CLICKETY], '0.4.2');
    };

    await checkManifests();
    await updateDependency('clap-clap', '4.2.0', { start: gear });

    await checkManifests();
    await updateDependency(CLICKETY, '6.6.5', { start: gear });

    let text = await readFile(gear, 'utf8');
    t.is(text, [
      '{',
      '  "name": "gear",',
      '  "private": true,',
      '  "peerDependencies": {',
      '    "clickety-clack": "6.6.5"',
      '  },',
      '  "devDependencies": {',
      '    "clickety-clack": "6.6.5"',
      '  },',
      '  "workspaces": [',
      '    "packages/*"',
      '  ]',
      '}',
      '',  // Force trailing EOL.
    ].join(EOL));

    text = await readFile(cog, 'utf8');
    t.is(text, [
      '{',
      '  "name": "cog",',
      '  "private": true,',
      '  "dependencies": {',
      '    "clickety-clack": "6.6.5"',
      '  }',
      '}',
      '',  // Force trailing EOL.
    ].join(EOL));

    await updateDependency(CLICKETY, '0.4.2', { start: gear });
    await checkManifests();

    t.end();
  });

  t.test('originalToInstrumented()', async function test(t) {
    const m1 = await originalToInstrumented({ start: cog });
    const o1 = keysOf(m1);
    t.is(o1.length, 0);

    const m2 = await originalToInstrumented({ start: resolve(fixtures, 'extra') });
    const o2 = keysOf(m2);
    t.is(o2.length, 1);
    t.is(o2[0], '/dev/js-junction/packages/oddjob/index.js');

    const instrumented = m2[o2[0]];
    t.ok(isArray(instrumented));
    t.is(instrumented.length, 3);

    const path = resolve(fixtures, 'node_modules', '.cache', 'nyc', 'instrumented.');
    t.ok(instrumented.includes(`${path}1.js`));
    t.ok(instrumented.includes(`${path}2.js`));
    t.ok(instrumented.includes(`${path}3.js`));

    t.end();
  });

  t.end();
});
