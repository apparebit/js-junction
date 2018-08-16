/* (c) Copyright 2018 Robert Grimm */

const { create } = Object;
const ERROR = Symbol('error');
const { isArray } = Array;

export function unwrapErrors(wrapper, delist) {
  const errors = wrapper[ERROR];
  return delist && errors.length === 1 ? errors[0] : errors;
}

export function isErrorWrapper(value) {
  return value != null && value[ERROR];
}

export function wrapErrors(errors) {
  if (!isArray(errors)) errors = [errors];
  return create(null, {
    [ERROR]: { value: errors },
  });
}
