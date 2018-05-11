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
      return { path, pkg: parse(await readFile(resolve(path, 'package.json'), 'utf8')) };
    } catch(x) {
      if( x.code !== 'ENOENT' ) throw x;
    }
  }
}

export async function packages(start = __dirname) {
  const { path, pkg } = await manifest(start);

  return has(pkg, 'workspaces')
    ? { path, pkg, pkgs: glob(pkg.workspaces, path, false) }
    : { path, pkg };
}

export async function updateDependency(name, version, start = __dirname) {
  const pattern = new RegExp(`"${name}"\\s*:\\s*"\\d+\\.\\d+\\.\\d+"`, 'gu');

  const { path, pkgs } = await packages(start);
  if( pkgs == null ) {
    throw ResourceNotFound(`manifest "${path}${sep}package.json" does not define workspaces`);
  }

  for( const directory of pkgs ) {
    const path = resolve(directory, 'package.json');
    const text = await readFile(path, 'utf8');
    const data = parse(text);

    const appearsIn = rel => data[rel] && data[rel][name];
    if( appearsIn('dependencies') || appearsIn('peerDependencies') ) {
      const revised = text.replace(pattern, `"${name}": "${version}"`);
      await writeFile(path, revised, 'utf8');
    }
  }
}

const ORIGINAL_PATH =
  /^(?:"main";)?var cov_\w+=function\(\)\{var path="(([^\\"]|\\.)*)",/u;

export function originalForInstrumented(text) {
  const match = ORIGINAL_PATH.exec(text);
  return match != null ? match[1] : null;
}

export async function instrumented(root) {
  //const pattern = resolve(root, '**/node_modules/.cache/nyc/*.js');
  const paths = await glob('**/node_modules/.cache/nyc/*.js', root, true);
  const mapping = create(null);

  for( const instrumented of paths ) {
    const text = await readFile(instrumented, 'utf8');
    const original = originalForInstrumented(text);
    if( original ) mapping[original] = instrumented;
  }

  return mapping;
}
