/* (c) Copyright 2017–2018 Robert Grimm */

// This module is loosely inspired by Node.js' [internal
// errors](https://github.com/nodejs/node/blob/master/lib/internal/errors.js).
// The key idea is that `code` now provides a stable identifier for the error
// condition and applications need not test error messages anymore.

const { defineProperty } = Object;
const CAUSE = Symbol('cause');
const CODE = Symbol('code');

function constant(value) {
  return {
    configurable: true,
    enumerable: false,
    value,
    writable: false,
  };
}

export function makeCodedError(Base) {
  return class CodedError extends Base {
    constructor(code, message, factory) {
      super(message);
      Error.captureStackTrace(this, factory);
      defineProperty(this, CAUSE, constant(null));
      defineProperty(this, CODE, constant(code));
    }

    causedBy(cause) {
      defineProperty(this, CAUSE, constant(cause));
      return this;
    }

    get name() {
      return `${super.name} [${this[CODE]}]`;
    }

    get code() {
      return this[CODE];
    }

    get cause() {
      return this[CAUSE];
    }
  };
}

export const CodedError = makeCodedError(Error);
export const CodedSyntaxError = makeCodedError(SyntaxError);
export const CodedTypeError = makeCodedError(TypeError);

export function E(code, formatter, Error = CodedError) {
  return function factory(...args) {
    return new Error(code, formatter(...args), factory);
  };
}
