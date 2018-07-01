/* (c) Copyright 2018 Robert Grimm */

import { dirname, resolve } from 'path';
import { default as doGlob } from 'fast-glob';
import { promisify } from 'util';
import {
  readdir as doReadDirectory,
  readFile as doReadFile,
  writeFile as doWriteFile,
} from 'fs';
import { ResourceNotFound } from '@grr/err';

const { create, keys: keysOf } = Object;
const { has } = Reflect;
const parentDirectory = dirname(__dirname);
const { parse } = JSON;
const readDirectory = promisify(doReadDirectory);
const readFile = promisify(doReadFile);
const writeFile = promisify(doWriteFile);

function glob(patterns, cwd) {
  return doGlob(patterns, {
    absolute: true,
    cwd,
    //dot: true,
    onlyDirectories: true,
    onlyFiles: false,
    unique: true,
  });
}

/**
 * Read the package manifest from the given directory. This function returns
 * the empty object if no such manifest exists.
 */
export async function readPackageFrom(directory) {
  const path = resolve(directory, 'package.json');

  try {
    const text = await readFile(path, 'utf8');
    const data = parse(text);
    return { directory, text, data };
  } catch (x) {
    /* istanbul ignore if or we need to inject errors into readFile(). */
    if (x.code !== 'ENOENT') throw x;
    // Destructuring the empty object produces no matches and does not throw.
    return {};
  }
}

/** Starting with the given directory, search for the first package manifest. */
export async function findPackage({ start = parentDirectory } = {}) {
  let directory = start;

  while (true) {
    const { text, data } = await readPackageFrom(directory);
    if (text && data) return { directory, text, data };

    const parent = dirname(directory);
    if (parent === directory) {
      throw ResourceNotFound(`no "package.json" above "${start}"`);
    }
    directory = parent;
  }
}

/**
 * Create a record with a package's essential information, i.e., its author,
 * description, license, name, and version.
 */
export function toPackageEssentials({
  author,
  description,
  license,
  name,
  version,
}) {
  return { author, description, license, name, version };
}

/**
 * Find all packages in a given repository. This function assumes that the
 * repo's top-level package manifest has a `workspaces` declaration specifying
 * the glob pattern for all embedded packages.
 */
export async function findAllPackages({
  start = parentDirectory,
  withText = false,
  select = toPackageEssentials,
} = {}) {
  const { directory: root, text, data } = await findPackage({ start });

  const result = {
    root,
    name: data.name,
    data: select(data),
    packages: create(null),
  };
  if (withText) result.text = text;

  if (has(data, 'workspaces')) {
    const directories = await glob(data.workspaces, root);
    for (const directory of directories) {
      const { text, data } = await readPackageFrom(directory);
      const { name } = data;

      result.packages[name] = {
        name,
        directory,
        data: select(data),
      };
      if (withText) result.packages[name].text = text;
    }
  }

  return result;
}

const DEPENDENCIES = ['dependencies', 'devDependencies', 'peerDependencies'];

export async function updateDependency(
  name,
  version,
  { logger = () => {}, start = parentDirectory } = {},
) {
  // Read in the repo's package manifests.
  const { root, text, data, packages } = await findAllPackages({
    start,
    withText: true,
    select: id => id,
  });

  // Prepare the update instruments.
  const pattern = new RegExp(`"${name}"\\s*:\\s*"\\d+\\.\\d+\\.\\d+"`, 'gu');
  const contains = (data, rel) => has(data, rel) && has(data[rel], name);
  const appearsIn = data => DEPENDENCIES.some(deps => contains(data, deps));
  const update = (path, text) => {
    logger('  -> updating "%s" to "%s"', name, version);
    const revised = text.replace(pattern, `"${name}": "${version}"`);
    return writeFile(path, revised, 'utf8');
  };

  // Do the actual updating.
  let count = 0;

  const path = resolve(root, 'package.json');
  logger('checking root manifest "%s"', path);
  if (appearsIn(data)) {
    await update(path, text);
    count++;
  }

  for (const pkg of keysOf(packages)) {
    const { directory, text, data } = packages[pkg];
    const path = resolve(directory, 'package.json');

    logger('checking package manifest "%s"', path);
    if (appearsIn(data)) {
      await update(path, text);
      count++;
    }
  }

  return count;
}

const ORIGINAL_PATH = /var cov_\w+=function\(\)\{var path='(([^\\']|\\.)*)',/u;

function originalPath(text) {
  const match = ORIGINAL_PATH.exec(text);
  return match != null ? match[1] : null;
}

/** Determine which modules have been instrumented by NYC and cached. */
export async function findInstrumentedModules({
  logger = () => {},
  start = parentDirectory,
} = {}) {
  const { root, packages } = await findAllPackages({ start });

  const patterns = [];
  patterns.push(resolve(root, 'node_modules/.cache/nyc/*.js'));
  if (packages != null) {
    for (const pkg of packages) {
      patterns.push(resolve(pkg, 'node_modules/.cache/nyc/*.js'));
    }
  }

  const paths = await glob(patterns, root);
  const mapping = create(null);

  for (const instrumented of paths) {
    logger('instrumented module "%s"', instrumented);
    const text = await readFile(instrumented, 'utf8');
    const original = originalPath(text);
    if (original) {
      logger('  => original module "%s"', original);

      // In a perfect world, we don't expect the same module to be instrumented
      // more than once, i.e., the following condition should never be true.
      // However, to be effective as a debugging aid, this function must assume
      // the opposite, i.e., that the constraint may be violated in practice.
      if (has(mapping, original)) {
        mapping[original].push(instrumented);
      } else {
        mapping[original] = [instrumented];
      }
    }
  }

  return mapping;
}

/** Determine the modules, for which NYC has collected coverage information. */
/* istanbul ignore next */
export async function findCoveredModules({
  start = parentDirectory,
  coverdir = '.nyc_output',
} = {}) {
  const { directory: root } = await findPackage({ start });
  const coverageDirectory = resolve(root, coverdir);

  let files;
  try {
    files = (await readDirectory(coverageDirectory)).filter(name =>
      name.endsWith('.json'),
    );
  } catch (x) {
    if (x.code !== 'ENOENT') throw x;
    return [];
  }

  const coverset = new Set();
  for (const file of files) {
    const path = resolve(coverageDirectory, file);
    const text = await readFile(path, 'utf8');
    for (const key of keysOf(parse(text))) {
      coverset.add(key);
    }
  }
  return [...coverset];
}
