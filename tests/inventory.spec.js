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
import { readdir as doReadDirectory, readFile as doReadFile } from 'fs';

const { isArray } = Array;
const { keys: keysOf } = Object;
const readDirectory = promisify(doReadDirectory);
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
      const pkgNames = (await readDirectory(pkgdir)).filter(
        entry => entry[0] !== '.',
      );
      t.is(pkgs.length, pkgNames.length);
      t.ok(pkgs.includes(resolve(pkgdir, 'err')));
      t.ok(pkgs.includes(resolve(pkgdir, 'inventory')));
      t.ok(pkgs.includes(resolve(pkgdir, 'knowledge')));
      t.ok(pkgs.includes(resolve(pkgdir, 'mark-of-dev')));
      t.ok(pkgs.includes(resolve(pkgdir, 'oddjob')));
      t.ok(pkgs.includes(resolve(pkgdir, 'proact')));
      t.ok(pkgs.includes(resolve(pkgdir, 'sequitur')));
    }

    {
      const { path, text, data, pkgs } = await packages({
        start: resolve(pkgdir, 'proact', 'html'),
      });

      t.is(path, resolve(pkgdir, 'proact'));
      t.ok(
        text.startsWith(
          '{\n  "name": "@grr/proact",\n  ' +
            '"description": "Making server-side rendering great again!",',
        ),
      );
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
    // Check that updateDependency() works with default options.
    const path = resolve(root, 'package.json');
    const text = await readFile(path, 'utf8');

    t.is(await updateDependency('@grr/utterly-unknown-package', '13.13.13'), 0);
    t.is(await readFile(path, 'utf8'), text);

    async function checkManifests(version = '0.4.2') {
      t.is(
        await readFile(gear, 'utf8'),
        [
          '{',
          '  "name": "gear",',
          '  "private": true,',
          '  "peerDependencies": {',
          `    "clickety-clack": "${version}"`,
          '  },',
          '  "devDependencies": {',
          `    "clickety-clack": "${version}"`,
          '  },',
          '  "workspaces": [',
          '    "packages/*"',
          '  ]',
          '}',
          '', // Force trailing EOL.
        ].join(EOL),
      );

      t.is(
        await readFile(cog, 'utf8'),
        [
          '{',
          '  "name": "cog",',
          '  "private": true,',
          '  "dependencies": {',
          `    "clickety-clack": "${version}"`,
          '  }',
          '}',
          '', // Force trailing EOL.
        ].join(EOL),
      );
    }

    // Check that manifests have expected content.
    await checkManifests();

    // Check that updateDependency() fails for conventional repositories.
    await t.rejects(updateDependency(CLICKETY, '13.13.13', { start: cog }));
    await checkManifests();

    // Check that updateDependency() has no effect for unknown package.
    t.is(await updateDependency('clap-clap', '4.2.0', { start: gear }), 0);
    await checkManifests();

    // Check that updateDependency() has expected effect for known package.
    t.is(await updateDependency(CLICKETY, '6.6.5', { start: gear }), 2);
    await checkManifests('6.6.5');

    // Restore original state.
    t.is(await updateDependency(CLICKETY, '0.4.2', { start: gear }), 2);
    await checkManifests();

    t.end();
  });

  t.test('originalToInstrumented()', async function test(t) {
    {
      // Ensure coverage for default parameters.
      const mappings = await originalToInstrumented();
      t.ok(mappings);
      t.is(typeof mappings, 'object');
    }

    {
      // Manifest in closest ancestor does not have workspaces; its directory does
      // not contain node_modules. Hence, there are no files cached by nyc.
      const mapping = await originalToInstrumented({ start: cog });
      const originals = keysOf(mapping);
      t.is(originals.length, 0);
    }

    {
      // Manifest in closest ancestor does have workspaces; its directory does
      // have node_modules, with three instrumented files.
      const mapping = await originalToInstrumented({
        start: resolve(fixtures, 'extra'),
      });
      const originals = keysOf(mapping);
      t.is(originals.length, 1);
      t.is(originals[0], '/dev/js-junction/packages/oddjob/index.js');

      const instrumented = mapping[originals[0]];
      t.ok(isArray(instrumented));
      t.is(instrumented.length, 3);

      const path = resolve(
        fixtures,
        'node_modules',
        '.cache',
        'nyc',
        'instrumented.',
      );
      t.ok(instrumented.includes(`${path}1.js`));
      t.ok(instrumented.includes(`${path}2.js`));
      t.ok(instrumented.includes(`${path}3.js`));
    }

    t.end();
  });

  t.end();
});
