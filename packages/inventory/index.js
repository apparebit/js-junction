/* (c) Copyright 2018 Robert Grimm */

import { dirname, resolve, sep } from 'path';
import doGlob from 'fast-glob';
import { promisify } from 'util';
import { readFile as doReadFile, writeFile as doWriteFile } from 'fs';
import { ResourceNotFound } from '@grr/err';

const { create } = Object;
const { has } = Reflect;
const { parse } = JSON;
const readFile = promisify(doReadFile);
const writeFile = promisify(doWriteFile);

// Glob for absolute, unique paths rooted in directory and matching pattern.
function glob(pattern, cwd, onlyFiles) {
  return doGlob(pattern, {
    absolute: true,
    cwd,
    dot: true,
    onlyDirectories: !onlyFiles,
    onlyFiles,
    unique: true,
  });
}

export async function manifest(start = __dirname) {
  let path = start;

  while(true) {
    const parent = dirname(path);
    if( parent === path ) throw ResourceNotFound(`no "package.json" above "${start}"`);
    path = parent;

    try {
      // Include both raw text and parsed data in result,
      // so that updateDependency() can work its magic.
      const text = await readFile(resolve(path, 'package.json'), 'utf8');
      const data = parse(text);
      return { path, text, data };
    } catch(x) {
      /* istanbul ignore if or we need to inject errors into readFile(). */
      if( x.code !== 'ENOENT' ) throw x;
    }
  }
}

export async function packages(start = __dirname) {
  const { path, text, data } = await manifest(start);

  return has(data, 'workspaces')
    ? { path, text, data, pkgs: await glob(data.workspaces, path, false) }
    : { path, text, data };
}

export async function updateDependency(name, version, {
  logger = () => {},
  start = __dirname,
} = {}) {
  const pattern = new RegExp(`"${name}"\\s*:\\s*"\\d+\\.\\d+\\.\\d+"`, 'gu');

  const { path, text, data, pkgs } = await packages(start);
  if( pkgs == null ) {
    throw ResourceNotFound(`manifest "${path}${sep}package.json" does not define workspaces`);
  }

  const hasName = (data, rel) => has(data, rel) && has(data[rel], name);
  const appearsIn = data =>
    hasName(data, 'dependencies')
    || hasName(data, 'devDependencies')
    || hasName(data, 'peerDependencies');
  const update = async function update(path, text, data) {
    if( appearsIn(data) ) {
      logger('updating "%s" to "%s" in "%s"', name, version, path);
      const revised = text.replace(pattern, `"${name}": "${version}"`);
      await writeFile(path, revised, 'utf8');
    }
  };

  // Update the repository's package.json.
  update(path, text, data);

  // Update each package's package.json.
  for( const directory of pkgs ) {
    const path = resolve(directory, 'package.json');
    const text = await readFile(path, 'utf8');
    const data = parse(text);

    update(path, text, data);
  }
}

const ORIGINAL_PATH =
  /var cov_\w+=function\(\)\{var path='(([^\\']|\\.)*)',/u;

export function originalPath(text) {
  const match = ORIGINAL_PATH.exec(text);
  return match != null ? match[1] : null;
}

export async function originalToInstrumented(root, {
  logger = () => {},
} = {}) {
  const paths = await glob('**/node_modules/.cache/nyc/*.js', root, true);
  const mapping = create(null);

  for( const instrumented of paths ) {
    logger('inspecting "%s"', instrumented);
    const text = await readFile(instrumented, 'utf8');
    const original = originalPath(text);
    if( original ) {
      logger('  originally "%s"', original);

      // In a perfect world, we don't expect the same module to be instrumented
      // more than once, i.e., the following condition should never be true.
      // However, to be effective as a debugging aid, this function must assume
      // the opposite, i.e., that the constraint may be violated in practice.
      if( has(mapping, original) ) {
        mapping[original].push(instrumented);
      } else {
        mapping[original] = [instrumented];
      }
    }
  }

  return mapping;
}
