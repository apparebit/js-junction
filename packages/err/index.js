/* (c) Copyright 2017–2018 Robert Grimm */

import { CodedTypeError, E } from './types';
import punning from './punning';
import { asArgId, asElements, asValue, quote } from './format';

export { ChildProcessError, ChildProcessExited } from './system';

export const DuplicateBinding = E(
  'ERR_DUPLICATE_BINDING',
  punning(
    (key, value, replacement) =>
      `"${key}" is bound to ${asValue(value)}, cannot be rebound to ${asValue(
        replacement,
      )}`,
  ),
);
export const FunctionNotImplemented = E(
  'ERR_FUNCTION_NOT_IMPLEMENTED',
  (name, kind = 'function') => `${kind} "${name}" is not implemented`,
);
export const InvalidArgType = E(
  'ERR_INVALID_ARG_TYPE',
  punning((key, value, spec, nspec = null) => {
    const prefix = `argument ${asArgId(key)} is ${asValue(value)}, but should`;
    return nspec ? `${prefix} not be ${nspec}` : `${prefix} be ${spec}`;
  }),
  CodedTypeError,
);
export const InvalidArgValue = E(
  'ERR_INVALID_ARG_VALUE',
  punning((key, value, spec = null) => {
    const base = `argument ${asArgId(key)} is ${asValue(value)}`;
    return spec ? `${base}, but ${spec}` : base;
  }),
);
export const InvalidArrayLength = E(
  'ERR_INVALID_ARRAY_LENGTH',
  punning(
    (key, value, expected) =>
      `array "${key}" has ${value} element${
        value !== 1 ? 's' : ''
      }, but should have ${expected}`,
  ),
);
export const InvalidCallback = E(
  'ERR_INVALID_CALLBACK',
  punning(name => `callback "${name}" is not a function`),
);
export const MalstructuredData = E(
  'ERR_MALSTRUCTURED_DATA',
  message => message,
);
export const MissingArgs = E(
  'ERR_MISSING_ARGS',
  (...names) =>
    `the ${asElements(quote(names))} argument${
      names.length === 1 ? ' is ' : 's are '
    }missing`,
);
export const MultipleCallback = E(
  'ERR_MULTIPLE_CALLBACK',
  (name, spec) =>
    `repeated invocation of callback "${String(name)}"${
      spec ? ` ${spec}` : ''
    }`,
);
export const ResourceBusy = E(
  'ERR_RESOURCE_BUSY',
  resource => `${resource} is busy`,
);
export const ResourceNotFound = E('ERR_RESOURCE_NOT_FOUND', message => message);
export const UnsupportedOperation = E(
  'ERR_UNSUPPORTED_OPERATION',
  spec => `operation "${spec}" is not supported`,
);
