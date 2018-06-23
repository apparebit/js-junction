/* (c) Copyright 2017–2018 Robert Grimm */

import { InvalidArgType } from '@grr/err';

const doApply = Reflect.apply;
const { stringify } = JSON;

export function maybe(fn, ...args) {
  if (typeof fn !== 'function') {
    throw InvalidArgType('fn', fn, 'a function');
  } else if (args.length) {
    for (const arg of args) {
      if (arg == null) return null;
    }
    return fn(...args);
  }

  return new Proxy(fn, {
    apply(target, that, args) {
      for (const arg of args) {
        if (arg == null) return null;
      }
      return doApply(target, that, args);
    },
  });
}

/** Convert the argument array to a primitive value, suitable as a map key. */
export function deobjectify(args) {
  if (args.length === 1) {
    const [arg] = args;

    if (arg == null || typeof arg !== 'object') {
      return arg;
    }
  }

  return stringify(args);
}

export function memoize(
  fn,
  { store = new Map(), serialize = deobjectify } = {},
) {
  if (typeof fn !== 'function') {
    throw InvalidArgType('fn', fn, 'a function');
  }

  return new Proxy(fn, {
    apply(target, that, args) {
      const key = serialize(args);
      if (!store.has(key)) {
        store.set(key, doApply(target, that, args));
      }
      return store.get(key);
    },
  });
}
