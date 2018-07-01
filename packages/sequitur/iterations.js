/* (C) Copyright 2018 Robert Grimm */

const { create, getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;

const configurable = true;

/** Determine whether the value is a generator function. */
export function isGeneratorFunction(value) {
  return (
    value != null &&
    value.constructor != null &&
    value.constructor.name === 'GeneratorFunction'
  );
}

/** Determine whether the value is an iterable. */
export function isIterable(value) {
  return value != null && typeof value[iterator] === 'function';
}

/** Determine whether the value is an iterator. */
export function isIterator(value) {
  return value != null && typeof value.next === 'function';
}

/** The built-in prototype for all iterators. */
export const IteratorPrototype = getPrototypeOf(getPrototypeOf([][iterator]()));

/** An immutable empty iterator. */
export const EmptyIterator = create(IteratorPrototype, {
  next: { configurable, value: () => ({ done: true }) },
  [toStringTag]: { configurable, value: 'EmptyIterator' },
});

/** Convert the value to an iterator factory. */
export function toIteratorFactory(value) {
  if (value == null) {
    return () => EmptyIterator;
  } else if (isIterator(value)) {
    return () => value;
  } else if (isIterable(value)) {
    return value[iterator].bind(value);
  } else if (typeof value === 'function') {
    return value;
  } else {
    value = [value];
    return value[iterator].bind(value);
  }
}
