/* (c) Copyright 2017 Robert Grimm */

// Loosely inspired by
// https://github.com/nodejs/node/blob/master/lib/internal/errors.js

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
  };
}

export const CodedError = makeCodedError(Error);
export const CodedTypeError = makeCodedError(TypeError);

export function E(code, formatter, Error = CodedError) {
  return function factory(...args) {
    return new Error(code, formatter(...args), factory);
  };
}

// The ID should be the argument's zero-based index or its name.
export function toArgumentId(id) {
  return typeof id === 'number' ? `#${id + 1}` : `"${String(id)}"`;
}

export function InvalidArgTypeMsg(key, value, spec, nspec = null) {
  const prefix = `argument ${toArgumentId(key)} is "${value}", but should`;
  return nspec ? `${prefix} not be ${nspec}` : `${prefix} be ${spec}`;
}

export function InvalidArgValueMsg(key, value, spec = null, nspec = null) {
  const base = `argument ${toArgumentId(key)} is "${value}"`;
  if( nspec ) {
    return `${base}, but should not be ${nspec}`;
  } else if( spec ) {
    return `${base}, but should be ${spec}`;
  } else {
    return base;
  }
}

export const InvalidArgType =
  E('ERR_INVALID_ARG_TYPE', InvalidArgTypeMsg, CodedTypeError);
export const InvalidArgValue =
  E('ERR_INVALID_ARG_VALUE', InvalidArgValueMsg);
