/* (C) Copyright 2018 Robert Grimm */

const { isNaN } = Number;
const { iterator } = Symbol;

/** Determine whether the value is ignorable. Traversal skips all such values. */
export function isIgnorable(value) {
  return value == null || value === false || value === true || isNaN(value) || value === '';
}

/**
 * Determine whether the value is iterable. Traversal transparently processes
 * all elements.
 */
export function isIterable(value) {
  return value != null && typeof value[iterator] === 'function';
}

/**
 * Determine whether the value is textual. Traversal converts each such a value
 * to a string, while also concatenating several such values into one string.
 */
export function isTextual(value) {
  const type = typeof value;
  return type === 'number' && !isNaN(value) || type === 'string' && value !== '';
}
