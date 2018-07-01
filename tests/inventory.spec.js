/* (c) Copyright 2018 Robert Grimm */

import {
  findPackage,
  findAllPackages,
  findInstrumentedModules,
  readPackageFrom,
  toPackageEssentials,
  updateDependency,
} from '@grr/inventory';

import { EOL } from 'os';
import harness from './harness';
import { promisify } from 'util';
import { dirname, resolve } from 'path';
import { readdir as doReadDirectory, readFile as doReadFile } from 'fs';

const { isArray } = Array;
const { keys: keysOf } = Object;
const readDirectory = promisify(doReadDirectory);
const readFile = promisify(doReadFile);

const REPO_ROOT = dirname(__dirname);
const PKG_DIR = resolve(REPO_ROOT, 'packages');

export default harness(__filename, t => {
  function checkTopLevelPackage(t, directory, data) {
    t.is(directory, REPO_ROOT);

    t.is(data.author, 'Robert Grimm');
    t.is(data.description, `@grr's monorepo for all things JavaScript`);
    t.is(data.license, 'MIT');
    t.is(data.name, 'js-junction');
    t.is(data.version, '6.6.5');
  }

  t.test('readPackage()', async function test(t) {
    const { directory, text, data } = await readPackageFrom(REPO_ROOT);

    t.is(directory, REPO_ROOT);
    checkTopLevelPackage(t, directory, data);
    t.ok(text.startsWith('{\n  "name": "js-junction",\n  "private": true,\n'));
    t.end();
  });

  t.test('findPackage()', async function test(t) {
    await t.rejects(findPackage({ start: dirname(REPO_ROOT) }), {
      code: 'ERR_RESOURCE_NOT_FOUND',
    });

    const { directory, text, data } = await findPackage();
    checkTopLevelPackage(t, directory, data);
    t.ok(text.startsWith('{\n  "name": "js-junction",\n  "private": true,\n'));
    t.end();
  });

  t.test('toPackageEssentials()', async function test(t) {
    const { data } = await readPackageFrom(REPO_ROOT);
    const essentials = toPackageEssentials(data);

    t.is(keysOf(essentials).length, 5);
    t.is(essentials.name, 'js-junction');
    t.is(essentials.version, '6.6.5');
    t.is(essentials.description, `@grr's monorepo for all things JavaScript`);

    t.end();
  });

  t.test('findAllPackages()', async function test(t) {
    {
      const directoryNames = (await readDirectory(PKG_DIR)).filter(
        name => name[0] !== '.',
      );

      const { root, name, data, packages } = await findAllPackages();
      t.is(root, REPO_ROOT);
      t.is(name, 'js-junction');
      checkTopLevelPackage(t, root, data);

      console.dir(directoryNames);
      console.dir(packages);

      t.is(keysOf(packages).length, directoryNames.length);
      for (const directory of directoryNames) {
        const name = `@grr/${directory}`;
        const entry = packages[name];

        t.ok(entry != null);
        t.is(entry.name, name);
        t.is(entry.directory, resolve(PKG_DIR, directory));
        t.is(entry.data.name, name);
        t.is(entry.data.author, 'Robert Grimm');
        t.is(entry.data.license, 'MIT');
      }
    }

    {
      const { root, text, data, packages } = await findAllPackages({
        start: resolve(PKG_DIR, 'proact'),
        withText: true,
      });

      t.is(root, resolve(PKG_DIR, 'proact'));
      t.ok(
        text.startsWith(
          '{\n  "name": "@grr/proact",\n  ' +
            '"description": "Making server-side rendering great again!",',
        ),
      );
      t.is(data.name, '@grr/proact');
      t.is(data.description, 'Making server-side rendering great again!');
      t.is(packages, void 0);
    }

    t.end();
  });

  const FIXTURES = resolve(__dirname, 'fixtures');
  const FAUX_REPO = resolve(FIXTURES, 'package.json');
  const FAUX_PAKET = resolve(FIXTURES, 'packages', 'das-paket', 'package.json');
  const FAUX_PAQUET_DIR = resolve(FIXTURES, 'packages', 'le-paquet');
  const FAUX_PAQUET = resolve(FAUX_PAQUET_DIR, 'package.json');
  const MY_PRECIOUS = 'my-precious';
  const DRECK = 'dreck';

  t.test('updateDependency()', async function test(t) {
    async function checkManifests({ version = '0.4.2' }) {
      t.is(
        await readFile(FAUX_REPO, 'utf8'),
        [
          '{',
          '  "name": "faux-repo",',
          '  "private": true,',
          '  "version": "2.0.0"',
          '  "devDependencies": {',
          `    "my-precious": "${version}"`,
          '  },',
          '  "workspaces": [',
          '    "packages/*"',
          '  ]',
          '}',
          '', // Force trailing EOL.
        ].join(EOL),
      );

      t.is(
        await readFile(FAUX_PAKET, 'utf8'),
        [
          '{',
          '  "name": "das-paket",',
          '  "private": true,',
          '  "description": "ooh"',
          '  "version": "2.0.0"',
          '  "dependencies": {',
          `    "my-precious": "${version}"`,
          '  },',
          '  "workspaces": [',
          '    "imaginary/*"',
          '  ]',
          '}',
          '', // Force trailing EOL.
        ].join(EOL),
      );

      t.is(
        await readFile(FAUX_PAQUET, 'utf8'),
        [
          '{',
          '  "name": "le-paquet",',
          '  "private": true,',
          '  "description": "ooh la la"',
          '  "version": "2.0.0"',
          '  "peerDependencies": {',
          `    "my-precious": "${version}"`,
          '  }',
          '}',
          '', // Force trailing EOL.
        ].join(EOL),
      );
    }

    // Check that manifests have expected content.
    await checkManifests({ version: '0.4.2' });

    // Check that updateDependency() has no effect for unknown package.
    t.is(await updateDependency(DRECK, '13.13.13', { start: FIXTURES }), 0);
    await checkManifests({ version: '0.4.2' });

    // Check that updateDependency() has expected effect for known package.
    t.is(await updateDependency(MY_PRECIOUS, '6.6.5', { start: FIXTURES }), 3);
    await checkManifests({ version: '6.6.5' });

    // Restore original state.
    t.is(await updateDependency(MY_PRECIOUS, '0.4.2', { start: FIXTURES }), 3);
    await checkManifests({ version: '0.4.2' });

    t.end();
  });

  t.test('findInstrumentedModules()', async function test(t) {
    {
      // Ensure coverage for default parameters.
      const mappings = await findInstrumentedModules();
      t.ok(mappings);
      t.is(typeof mappings, 'object');
    }

    {
      // Manifest does not specify workspaces and directory does not contain
      // node_modules. Hence, there are no files cached by nyc.
      const mapping = await findInstrumentedModules({ start: FAUX_PAQUET_DIR });
      const originals = keysOf(mapping);
      t.is(originals.length, 0);
    }

    {
      // Manifest does have workspaces and directory does have node_modules,
      // with three instrumented files.
      const mapping = await findInstrumentedModules({ start: FIXTURES });
      const originals = keysOf(mapping);
      t.is(originals.length, 1);
      t.is(originals[0], '/dev/js-junction/packages/oddjob/index.js');

      const instrumented = mapping[originals[0]];
      t.ok(isArray(instrumented));
      t.is(instrumented.length, 3);

      const path = resolve(
        FIXTURES,
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
