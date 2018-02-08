/* (c) Copyright 2017–2018 Robert Grimm */

import { CodedTypeError, E, InvalidArgTypeMsg, InvalidArgValueMsg } from './internal/errors';
import { withKeyValue } from './internal/key-value';
import show from './show';

const showCount = show().length().noun('element');
const showArgNames = show().quoted.elements().noun('argument').verb();

export const DuplicateBinding = E('ERR_DUPLICATE_BINDING',
  withKeyValue((key, value, replacement) =>
    `"${key}" is bound to "${String(value)}", cannot be rebound to "${String(replacement)}"`));
export const FunctionNotImplemented = E('ERR_FUNCTION_NOT_IMPLEMENTED',
  (name, kind = 'function') => `${kind} "${name}" is not implemented`);
export const InvalidArgType = E('ERR_INVALID_ARG_TYPE',
  withKeyValue(InvalidArgTypeMsg), CodedTypeError);
export const InvalidArgValue = E('ERR_INVALID_ARG_VALUE',
  withKeyValue(InvalidArgValueMsg));
export const InvalidArrayLength = E('ERR_INVALID_ARRAY_LENGTH',
  withKeyValue((key, value, expected) =>
    `array "${key}" has ${showCount.of(value)}, but should have ${expected}`));
export const MissingArgs = E('ERR_MISSING_ARGS',
  (...names) => `the ${showArgNames.of(names)} missing`);
export const MultipleCallback = E('ERR_MULTIPLE_CALLBACK',
  (name, spec) => `repeated invocation of callback "${String(name)}"${spec ? ` ${spec}` : ''}`);
export const ResourceBusy = E('ERR_RESOURCE_BUSY',
  resource => `${resource} is busy`);

export const createErrorFactory = E;
