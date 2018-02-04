/* (C) Copyright 2017 Robert Grimm */

const { assign } = Object;

export const configurable = true;
export const enumerable = true;
export const writable = true;

/**
 * Create the property descriptor for a value. In lieu of overrides, the
 * property is configurable but neither enumerable nor writable.
 */
export function value(value, overrides = null) {
  const descriptor = {
    configurable: true,
    enumerable: false,
    value,
    writable: false
  };

  return overrides ? assign(descriptor, overrides) : descriptor;
}

/**
 * Create the property descriptor for a constant value, which is neither
 * configurable or writable.
 */
export function constant(value, enumerable = false) {
  return {
    configurable: false,
    enumerable,
    value,
    writable: false,
  };
}
