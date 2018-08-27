/* (c) Copyright 2018 Robert Grimm */

import chalk from 'chalk';
import { format } from 'util';
import parseArguments from 'mri';
import {
  findAllPackages,
  getDependencyVersions,
  updateDependency,
} from '@grr/inventory';

const { keys: keysOf } = Object;
const { max } = Math;

const args = parseArguments(process.argv.slice(2), {
  boolean: ['debug'],
});

if (args._.length !== 1 && args._.length !== 2) {
  console.error(
    chalk.red(`Usage: yarn run version [--debug] <package> [<version>]`)
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

const [dependency, version] = args._;
if (version && !/^\d+\.\d+.\d+$/u.test(version)) {
  console.error(
    chalk.red(
      `Package version "${version}" does not have format "\\d+.\\d+.\\d+"`
    )
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

async function getVersions() {
  const { packages } = await findAllPackages({ select: v => v });
  const pkgNames = keysOf(packages);
  const pkgNameLength = pkgNames.reduce((acc, n) => max(acc, n.length), 0);

  for (const pkgName of pkgNames) {
    const n = pkgName.padEnd(pkgNameLength);

    const versions = getDependencyVersions(packages[pkgName].data, dependency);
    for (const kind of keysOf(versions || {})) {
      const k = kind.padEnd(16);
      const v = versions[kind];
      const clr = chalk.bold.blue;
      console.error(`${clr(n)} :: ${clr(k)} :: ${clr(`${dependency}@${v}`)}`);
    }
  }
}

async function setVersion() {
  const count = await updateDependency(
    dependency,
    version,
    args.debug
      ? {
          logger(...args) {
            console.error(chalk.grey(`# ${format(...args)}`));
          },
        }
      : void 0
  );
  const color = count ? chalk.green : chalk.grey;
  console.error(color(`Updated ${count} manifest(s)`));
}

if (version) {
  setVersion();
} else {
  getVersions();
}
