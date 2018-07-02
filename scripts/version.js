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

const args = parseArguments(process.argv.slice(2), {
  boolean: ['debug'],
});

if (args._.length !== 1 && args._.length !== 2) {
  console.error(
    chalk.red(`Usage: yarn run version [--debug] <package> [<version>]`)
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

const [name, version] = args._;
if (version && !/^\d+\.\d+.\d+$/u.test(version)) {
  console.error(
    chalk.red(
      `Package version "${version}" does not have format "\\d+.\\d+.\\d+"`
    )
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

function reportDependency(from, to, versions) {
  if (versions) {
    for (const grouping of keysOf(versions)) {
      const version = versions[grouping];
      console.error(
        chalk.bold.blue(`${from} :: ${grouping} :: ${to}@${version}`)
      );
    }
  }
}

async function getVersion() {
  const { data, packages } = await findAllPackages({
    select: v => v,
  });
  const repo = data.name;

  reportDependency(repo, name, getDependencyVersions(data, name));
  for (const packageName of keysOf(packages)) {
    reportDependency(
      packageName,
      name,
      getDependencyVersions(packages[packageName].data, name)
    );
  }
}

async function setVersion() {
  let count;
  if (args.debug) {
    count = await updateDependency(name, version, {
      logger(...args) {
        console.error(chalk.grey(`# ${format(...args)}`));
      },
    });
  } else {
    count = await updateDependency(name, version);
  }

  const color = count ? chalk.green : chalk.grey;
  console.error(color(`Updated ${count} manifest(s)`));
}

if (version) {
  setVersion();
} else {
  getVersion();
}
