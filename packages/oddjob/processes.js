/* (c) Copyright 2018 Robert Grimm */

import { ChildProcessError, ChildProcessExited } from '@grr/err';

const { execArgv } = process;

const WITH_INSPECTOR = new RegExp(`^(${['', '-brk', '-port']
  .map(suffix => [`--inspect${suffix}`, `--debug${suffix}`])
  .reduce((flags, pair) => [...flags, ...pair])
  .join('|')})(?:=(\\d+))?$`, 'u');

export function withoutInspector(args = execArgv) {
  const result = [];

  for( const arg of args ) {
    if( !arg.match(WITH_INSPECTOR) ) {
      result.push(arg);
    }
  }

  return result;
}

export function onExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', err => {
      reject(ChildProcessError(child.pid, err));
    });
    child.once('exit', (code, signal) => {
      if( code === 0 ) {
        resolve();
      } else {
        reject(ChildProcessExited(child.pid, code, signal));
      }
    });
  });
}
