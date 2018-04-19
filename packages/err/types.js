/* (c) Copyright 2017–2018 Robert Grimm */

// Loosely inspired by
// https://github.com/nodejs/node/blob/master/lib/internal/errors.js

import { asArgId, asValue} from './format';

const CAUSE = Symbol('cause');
const CODE = Symbol('code');
const { defineProperty } = Object;

export function makeCodedError(Base) {
  return class CodedError extends Base {
    constructor(code, message, factory) {
      super(message);
      Error.captureStackTrace(this, factory);
      defineProperty(this, CODE, {
        configurable: true,
        value: code,
      });
    }

    get name() {
      return `${super.name} [${this[CODE]}]`;
    }

    get code() {
      return this[CODE];
    }

    causedBy(cause) {
      this[CAUSE] = cause;
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
