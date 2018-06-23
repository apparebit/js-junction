/* (C) Copyright 2018 Robert Grimm */

const { create, freeze, getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;

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

/** Convert an iteration's step function into an iterator that also is an iterable. */
export function toIterator(next, props) {
  return create(IteratorPrototype, {
    ...props,
    next: {
      configurable: true,
      enumerable: false,
      value: next,
      writable: false,
    },
  });
}

/** Convert an iterator into an iterator that also is iterable. */
export function toIterable(iter) {
  return isIterable(iter) ? iter : toIterator(iter.next.bind(iter));
}

/** An immutable empty iterator. */
export const EmptyIterator = freeze(
  toIterator(() => ({ done: true }), {
    [toStringTag]: {
      value: 'EmptyIterator',
    },
  }),
);

/**
 * Convert an iterator into an replayable iterator factory. The first iterator
 * returned from such a factory delegates to the original iterator, while also
 * recording all values. Subsequent iterators simply replay that recording. Of
 * course, for this to work, the first iterator must run to completion and its
 * value computation must be limited to a deterministic derivation of its own
 * state.
 */
export function toReplayable(iter) {
  let tape;

  return function* createIterator() {
    if (tape === void 0) {
      tape = [];
      for (const element of toIterable(iter)) {
        tape.push(element);
        yield element;
      }
    } else {
      yield* tape;
    }
  };
}

/** Convert the value to an iterator factory, i.e., an iterable's `@@iterator` method. */
export function toIteratorFactory(value) {
  if (value == null) {
    return () => EmptyIterator;
  } else if (isIterator(value)) {
    return toReplayable(value);
  } else if (isIterable(value)) {
    return value[iterator].bind(value);
  } else if (typeof value === 'function') {
    return value;
  } else {
    return (value = [value])[iterator].bind(value);
  }
}
