/* (C) Copyright 2018 Robert Grimm */

export function nonenumerable(value, writable = true) {
  return {
    configurable: true,
    enumerable: false,
    value,
    writable,
  };
}

export function constant(value) {
  return nonenumerable(value, false);
}
