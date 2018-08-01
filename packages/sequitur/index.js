/* (C) Copyright 2018 Robert Grimm */

import { isNonStringIterable, toIteratorFactory } from './iterations.js';

// A private sentinel indicating a definitely undefined accumulator.
const UNDEFINED = Symbol('undefined');

const { iterator } = Symbol;
const { keys: keysOf } = Object;

export default class Sq {
  /* private */ constructor(factory) {
    this.factory = factory;
  }

  // === Static Factory Methods (Usable as Functions) ===

  static of(...values) {
    return new Sq(() => values[iterator]());
  }

  static from(value) {
    return new Sq(toIteratorFactory(value));
  }

  /**
   * Return a new sequence over the object's `[key, value]` entries. The keys
   * reflect the state of the object when a chain's terminal operation is first
   * invoked. Each value reflects the state of the property when the element is
   * yielded by the returned iterable.
   */
  static entries(object) {
    return new Sq(function* enumerating() {
      for (const key of keysOf(object)) {
        yield [key, object[key]];
      }
    });
  }

  // === Iterator Factory (Reusable for Most Wrapped Values) ===

  [iterator]() {
    return this.factory();
  }

  // === Lazy and Chainable Operations ===

  flatten() {
    const source = this;
    return new Sq(function* flattening(iterable = source) {
      for (const element of iterable) {
        if (isNonStringIterable(element)) {
          yield* flattening(element);
        } else {
          yield element;
        }
      }
    });
  }

  entries() {
    const source = this;
    return new Sq(function* enumerating() {
      let count = 0;
      for (const element of source) {
        yield [count++, element];
      }
    });
  }

  filter(fn) {
    const source = this;
    return new Sq(function* filtering() {
      for (const element of source) {
        if (fn(element)) yield element;
      }
    });
  }

  map(fn) {
    const source = this;
    return new Sq(function* mapping() {
      for (const element of source) {
        yield fn(element);
      }
    });
  }

  flatMap(fn) {
    const source = this;
    return new Sq(function* flatMapping() {
      for (const element of source) {
        yield* fn(element);
      }
    });
  }

  tap(fn) {
    const source = this;
    return new Sq(function* tapping() {
      for (const element of source) {
        fn(element);
        yield element;
      }
    });
  }

  // === Eager and Terminal Operations ===

  // Unlike Array's reduce(), this version requires an initial value.
  reduce(fn, initial) {
    let accumulator = initial;
    for (const element of this) {
      accumulator = fn(accumulator, element);
    }
    return accumulator;
  }

  // Unlike Array's join(), this version uses empty string as default separator.
  join(separator = '') {
    let text = UNDEFINED;
    for (const element of this) {
      if (text === UNDEFINED) {
        text = String(element);
      } else {
        text += separator + String(element);
      }
    }
    return text === UNDEFINED ? '' : text;
  }

  collect(array = []) {
    for (const element of this) {
      array.push(element);
    }
    return array;
  }

  collectEntries(object = {}) {
    for (const [key, value] of this) {
      object[key] = value;
    }
    return object;
  }
}
