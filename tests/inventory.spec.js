/* (c) Copyright 2018 Robert Grimm */

import {
  manifest,
  originalToInstrumented,
  packages,
  updateDependency,
} from '@grr/inventory';

import { EOL } from 'os';
import harness from './harness';
import { MalstructuredData } from '@grr/err';
import { promisify } from 'util';
import { resolve } from 'path';
import { readFile as doReadFile } from 'fs';

const { has } = Reflect;
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
    await t.rejects(manifest(resolve(root, '..')), {
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
      const { path, text, data, pkgs } = await packages(resolve(pkgdir, 'proact', 'html'));

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
  const CLICKETY = 'clickety-clack';

  t.test('updateDependency()', async function test(t) {
    async function manifestAt(path) {
      const text = await readFile(path, 'utf8');
      console.log(text);
      const data = parseJSON(text);

      let version;
      for( const deps of ['dependencies', 'devDependencies', 'peerDependencies'] ) {
        if( has(data, deps) && has(data[deps], CLICKETY) ) {
          const v = data[deps][CLICKETY];

          if( version == null ) {
            console.log(`>>>> v${v}`);
            version = v;
          } else if( version !== v ) {
            throw MalstructuredData(`${
              CLICKETY
            } has inconsistent versions "${
              version
            }" and "${
              v
            }"`);
          }
        }
      }

      return { text, version };
    }

    const gear = resolve(fixtures, 'package.json');
    const cog = resolve(fixtures, 'packages', 'cog', 'package.json');

    t.is(manifestAt(gear).version, '0.4.2');
    t.is(manifestAt(cog).version, '0.4.2');

    await updateDependency('fiction', '6.6.5', {
      start: fixtures,
    });

    const m0 = manifestAt(gear);
    const m1 = manifestAt(cog);

    t.is(m0.version, '6.6.5');
    t.is(m1.version, '6.6.5');

    t.is(m0.text, [
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
    ].join(EOL));

    t.is(m1.text, [
      '{',
      '  "name": "cog",',
      '  "private": true,',
      '  "dependencies": {',
      '    "clickety-clack": "6.6.5"',
      '  }',
      '}',
    ].join(EOL));

    await updateDependency('fiction', '0.4.2', {
      start: fixtures,
    });

    t.is(manifestAt(gear).version, '0.4.2');
    t.is(manifestAt(cog).version, '0.4.2');

    t.end();
  });

  t.test('originalToInstrumented()', async function test(t) {
    const mapping = await originalToInstrumented(fixtures);
    const originals = keysOf(mapping);
    t.is(originals.length, 1);
    t.is(originals[0], '/dev/js-junction/packages/oddjob/index.js');

    const instrumented = mapping[originals[0]];
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
