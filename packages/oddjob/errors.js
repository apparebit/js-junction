/* (c) Copyright 2017 Robert Grimm */

import {
  CodedTypeError,
  E,
  InvalidArgTypeMsg,
  InvalidArgValueMsg,
} from './internal/errors';
import show from './show';

const showCount = show().length().noun('element');
const showArgNames = show().quoted.elements().noun('argument').verb();

export const DuplicateBinding = E('ERR_DUPLICATE_BINDING',
  (key, value, replacement) =>
    `"${key}" is bound to "${value}", cannot be rebound to "${replacement}"`);
export const InvalidArgType = E('ERR_INVALID_ARG_TYPE',
  InvalidArgTypeMsg, CodedTypeError);
export const InvalidArgValue = E('ERR_INVALID_ARG_VALUE',
  InvalidArgValueMsg);
export const InvalidArrayLength = E('ERR_INVALID_ARRAY_LENGTH',
  (key, value, expected) =>
    `array "${key}" has ${showCount.of(value)}, but should have ${expected}`);
export const MethodNotImplemented = E('ERR_METHOD_NOT_IMPLEMENTED',
  name => `the ${name}() method is not implemented`);
export const MissingArgs = E('ERR_MISSING_ARGS',
  (...names) => `the ${showArgNames.of(names)} missing`);
