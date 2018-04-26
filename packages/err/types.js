/* (c) Copyright 2017–2018 Robert Grimm */

// This module is loosely inspired by Node.js' [internal
// errors](https://github.com/nodejs/node/blob/master/lib/internal/errors.js).
// The key idea is that `code` now provides a stable identifier for the error
// condition and applications need not test error messages anymore.

import { asArgId, asValue} from './format';

const { defineProperty } = Object;
const { isArray } = Array;

// Reuse Node.js' symbol both in honor of the Node.js module
// and in defiance of the Node.js module being internal! 😈
let sym;
try {
  Buffer.from();
} catch(x) {
  sym = Object.getOwnPropertySymbols(x);
}

/* istanbul ignore else since it provides fallback when extraction fails. */
if( isArray(sym) && sym.length === 1 ) {
  [sym] = sym;
} else {
  sym = Symbol('code');
}

const CAUSE = Symbol('cause');
const CODE = sym;

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

    get name() {
      return `${super.name} [${this[CODE]}]`;
    }

    get code() {
      return this[CODE];
    }

    causedBy(cause) {
      defineProperty(this, CAUSE, constant(cause));
      return this;
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

export function InvalidArgTypeMsg(key, value, spec, nspec = null) {
  const prefix = `argument ${asArgId(key)} is ${asValue(value)}, but should`;
  return nspec ? `${prefix} not be ${nspec}` : `${prefix} be ${spec}`;
}

export function InvalidArgValueMsg(key, value, spec = null) {
  const base = `argument ${asArgId(key)} is ${asValue(value)}`;
  return spec ? `${base}, but ${spec}` : base;
}

export const InvalidArgType = E('ERR_INVALID_ARG_TYPE', InvalidArgTypeMsg, CodedTypeError);
export const InvalidArgValue = E('ERR_INVALID_ARG_VALUE', InvalidArgValueMsg);
