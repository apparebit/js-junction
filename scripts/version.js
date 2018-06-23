/* (c) Copyright 2018 Robert Grimm */

import chalk from 'chalk';
import { format } from 'util';
import parseArguments from 'mri';
import { updateDependency } from '@grr/inventory';

const args = parseArguments(process.argv.slice(2), {
  boolean: ['debug'],
});

if (args._.length !== 2) {
  console.error(
    chalk.red(`Usage: yarn run version [--debug] <package> <version>`),
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

const [name, version] = args._;
if (!/^\d+\.\d+.\d+$/u.test(version)) {
  console.error(
    chalk.red(
      `Package version "${version}" does not have format "\\d+.\\d+.\\d+"`,
    ),
  );
  process.exit(13); // eslint-disable-line no-process-exit
}

(async function main() {
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

  if (count) console.error(chalk.green(`Updated ${count} manifest(s)`));
})();
