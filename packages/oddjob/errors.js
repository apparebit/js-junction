/* (c) Copyright 2017 Robert Grimm */

// Loosely inspired by
// https://github.com/nodejs/node/blob/master/lib/internal/errors.js

import show from './show';

const CODE = Symbol('code');
const { defineProperty } = Object;

function makeCodedError(Base) {
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

const CodedError = makeCodedError(Error);
const CodedTypeError = makeCodedError(TypeError);

const showCount = show().length().noun('element');
const showArgNames = show().quoted.elements().noun('argument').verb();

function E(code, formatter, Error = CodedError) {
  return function factory(...args) {
    return new Error(code, formatter(...args), factory);
  };
}

export const DuplicateBinding = E('ERR_DUPLICATE_BINDING',
  (key, value, replacement) =>
    `"${key}" is bound to "${value}", cannot be rebound to "${replacement}"`);
export const InvalidArgType = E('ERR_INVALID_ARG_TYPE',
  (key, value, type) =>
    `argument "${key}" is "${value}", but should be ${type}`, CodedTypeError);
export const InvalidArgValue = E('ERR_INVALID_ARG_VALUE',
  (key, value) =>
    `argument "${key}" is invalid "${value}"`);
export const InvalidArrayLength = E('ERR_INVALID_ARRAY_LENGTH',
  (key, value, expected) =>
    `array "${key}" has ${showCount.of(value)}, but should have ${expected}`);
export const MethodNotImplemented = E('ERR_METHOD_NOT_IMPLEMENTED',
  name => `the ${name}() method is not implemented`);
export const MissingArgs = E('ERR_MISSING_ARGS',
  (...names) => `the ${showArgNames.of(names)} missing`);
