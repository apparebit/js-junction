/* (c) Copyright 2018 Robert Grimm */

import assert from 'assert';
import debuggery from 'debug';
import { EOL } from 'os';
import { isArray } from 'util';
import { isErrorWrapper, unwrapErrors, wrapErrors } from './wrapper.js';

const CONTEXT = Symbol('context');
const debug = debuggery('@grr:typical');
const { keys: keysOf } = Object;

const PASS = debug.useColors
  ? '\x1b[1;32mPASS\x1b[22;39m'
  : /* istanbul ignore next */ 'PASS';
const FAIL = debug.useColors
  ? '\x1b[1;31mFAIL\x1b[22;39m'
  : /* istanbul ignore next */ 'FAIL';

const pool = [];
let pooled = 0;

export default class Context {
  constructor() {
    this[CONTEXT] = true;
    this.validateAndCopy = void 0;
    this.continueAfterError = void 0;
    this.ignoreExtraProps = void 0;
    this.recognizeAsArray = void 0;
    this.path = [];
    this.errors = [];
  }

  static isRequired(context) {
    return context == null || !context[CONTEXT];
  }

  static mergeConfig(primary, secondary) {
    const result = {};
    for (const config of [secondary, primary]) {
      for (const key of keysOf(Object(config))) {
        const value = config[key];
        if (value !== void 0) result[key] = value;
      }
    }
    return result;
  }

  // The effective main entry point for all typical types.
  static with(value, type, callConfig, apiConfig) {
    if (!pool.length) {
      assert(
        pooled === 0,
        `context pool already has one reusable object, it shouldn't require more`
      );
      pool.push(new Context());
      pooled++;
    }

    const context = pool
      .pop()
      .reset(Context.mergeConfig(callConfig, apiConfig));

    try {
      const result = type(value, context);
      const pass = context.errors.length === 0;
      const asPredicate = callConfig && callConfig.asPredicate;

      /* istanbul ignore else */
      if (__DEV__) {
        const unwrapped = !isErrorWrapper(result);

        /* istanbul ignore if */
        if (unwrapped !== pass) {
          const num = context.errors.length;
          assert.fail(
            `context recorded ${num} error${
              num !== 1 ? 's' : ''
            } yet type returned a ${unwrapped ? 'non-' : ''}error value`
          );
        }
      }

      debug(
        '%s %s value "%o" with %s type "%s"',
        pass ? PASS : FAIL,
        asPredicate
          ? '  attest'
          : context.validateAndCopy
            ? '  create'
            : 'validate',
        value,
        type.kind,
        type.name
      );

      if (pass) {
        return asPredicate ? true : result;
      } else {
        return asPredicate ? false : context.throwError();
      }
    } finally {
      pool.push(context);
    }
  }

  reset({
    validateAndCopy,
    continueAfterError,
    ignoreExtraProps,
    recognizeAsArray,
  } = {}) {
    this.validateAndCopy = validateAndCopy;
    this.continueAfterError = continueAfterError;
    this.ignoreExtraProps = ignoreExtraProps;
    this.recognizeAsArray = recognizeAsArray;
    this.path.length = 0;
    this.errors.length = 0;
    return this;
  }

  enter(key) {
    this.path.push(key);
  }

  exit() {
    this.path.pop();
  }

  toValue(value) {
    return value;
  }

  isArray(value) {
    return isArray(value);
  }

  toArray(cardinality, value) {
    switch (cardinality) {
      case 0:
        return [];
      case 1:
        return [value];
      default:
        return value;
    }
  }

  isErrorWrapper(value) {
    return isErrorWrapper(value);
  }

  wrapErrors(causes) {
    return wrapErrors(causes);
  }

  unwrapErrors(wrapper, unwrapSingleton = true) {
    return unwrapErrors(wrapper, unwrapSingleton);
  }

  mergeWrappers(...wrappers) {
    const errors = [];
    for (const wrapper of wrappers) {
      errors.push(...unwrapErrors(wrapper, false));
    }
    return wrapErrors(errors);
  }

  valueIsNotOfType(value, type) {
    value = `value "${String(value)}"`;
    type = `of type ${type.name}`;

    const cause = new TypeError(
      this.path.length
        ? `${value} of property "${this.path.join('.')}" is not ${type}`
        : `${value} is not ${type}`
    );
    this.errors.push(cause);
    return wrapErrors(cause);
  }

  valueHasExtraProperties(value, keys) {
    const { length } = keys;
    keys = keys.map(k => `"${k}"`);

    if (length === 1) {
      keys = `key ${keys[0]}`;
    } else if (length === 2) {
      keys = `keys ${keys[0]} and ${keys[1]}`;
    } else {
      keys = `keys ${keys.slice(0, -1).join(', ')}, and ${keys[length - 1]}`;
    }

    const cause = new TypeError(
      this.path.length
        ? `value of property "${this.path.join('.')}" has extra ${keys}`
        : `value has extra ${keys}`
    );
    this.errors.push(cause);
    return wrapErrors(cause);
  }

  typeIgnoringErrors(value, type) {
    // Capture count of accumulated errors before type check.
    const count = this.errors.length;
    try {
      return type(value, this);
    } finally {
      // Restore that same count again.
      this.errors.splice(count, this.errors.length - count);
    }
  }

  tallyErrors(causes, wrapper) {
    causes = causes || [];
    causes.push(...unwrapErrors(wrapper, false));
    return causes;
  }

  throwError(causes = this.errors) {
    const violations = `type violation${causes.length !== 1 ? 's' : ''}`;
    const detail = causes
      .map((el, idx) => `  #${idx + 1}: ${el.message}`)
      .join(EOL);
    const error = new TypeError(
      `due to ${causes.length} ${violations}:${EOL}${detail}`
    );
    error.causes = [...causes];
    throw error;
  }
}
