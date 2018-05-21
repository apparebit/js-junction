/* (C) Copyright 2018 Robert Grimm */

const { create, getPrototypeOf } = Object;
const { iterator } = Symbol;

export const IteratorPrototype = getPrototypeOf(getPrototypeOf([][iterator]()));

export const EmptyIterator = create(IteratorPrototype, {
  next: {
    configurable: false,
    enumerable: false,
    value: () => ({ done: true }),
    writable: false,
  },
});

export function isIterable(value) {
  return value != null && typeof value[iterator] === 'function';
}

export function isIterator(value) {
  return value != null && typeof value.next === 'function';
}

export function toIteratorFactory(iter) {
  let capture;

  return function* createIterator() {
    if( capture === void 0 ) {
      // Consistent with this package's lazy and reusable combinators, capture
      // an iterator's elements during its first iteration and then play them
      // back on subsequent iterations. Of course, that only works if the
      // iterator is deterministic and the first iteration covered all elements.
      capture = [];

      const elements = isIterable(iter) ? iter : { [iterator]: () => iter };
      for( const element of elements ) {
        capture.push(element);
        yield element;
      }
    } else {
      yield* capture;
    }
  };
}
