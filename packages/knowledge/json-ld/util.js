/* (C) Copyright 2018 Robert Grimm */

export function constant(value) {
  return {
    configurable: true,
    enumerable: false,
    value,
    writable: false,
  };
}
