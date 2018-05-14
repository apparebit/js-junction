/* (c) Copyright 2018 Robert Grimm */

import { CodedError } from './types';

const PID = Symbol('pid');
const EXIT_CODE = Symbol('exit-code');
const SIGNAL = Symbol('signal');

function formatChildProcessExited(pid, code, signal) {
  const prefix = `child process ${pid} exited`;

  if( code === 0 ) {
    return `${prefix} normally with code "0"`;
  } else if( code != null ) {
    return `${prefix} abnormally with code "${code}"`;
  } else {
    return `${prefix} abnormally with signal "${signal}"`;
  }
}

class ChildProcessErrorType extends CodedError {
  constructor(code, pid, message, exitCode, signal, factory) {
    super(code, message, factory);
    this[PID] = pid;
    this[EXIT_CODE] = exitCode;
    this[SIGNAL] = signal;
  }

  get pid() { return this[PID]; }
  get exitCode() { return this[EXIT_CODE]; }
  get signal() { return this[SIGNAL]; }
}

export function ChildProcessExited(pid, code, signal) {
  return new ChildProcessErrorType(
    'ERR_CHILD_PROCESS_EXITED', pid,
    formatChildProcessExited(pid, code, signal),
    code, signal, ChildProcessExited
  );
}

export function ChildProcessError(pid, err) {
  return new ChildProcessErrorType(
    'ERR_CHILD_PROCESS_ERR', pid,
    `child process ${pid} raised error: ${err.message}`,
    null, null, ChildProcessError
  ).causedBy(err);
}
