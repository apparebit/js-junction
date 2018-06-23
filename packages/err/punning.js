/* (C) Copyright 2018 Robert Grimm */

const doApply = Reflect.apply;
const { isArray } = Array;
const keysOf = Object.keys;

const KEY_TYPES = new Set(['number', 'string', 'symbol']);

/** Determine whether the entity is a valid property key, i.e., number, string, or symbol. */
export function isPropertyKey(value) {
  return KEY_TYPES.has(typeof value);
}

/**
 * Convert the object to a `[key, value]` pair. The argument must, in fact, be
 * an object.
 */
export function toKeyValue(object) {
  if (typeof object === 'function') {
    return [object.name, object];
  } else if (isArray(object)) {
    if (object.length === 2 && isPropertyKey(object[0])) {
      return object;
    }
  } else {
    const keys = keysOf(object);

    if (keys.length === 1) {
      const [key] = keys;
      return [key, object[key]];
    } else if (
      keys.length === 2 &&
      keys.includes('key') &&
      keys.includes('value')
    ) {
      return [object.key, object.value];
    }
  }

  // Look ma, no key!
  return [void 0, object];
}

export default function punning(original, ...indices) {
  if (!indices.length) indices = [0];

  return new Proxy(original, {
    apply(target, that, args) {
      for (const index of indices) {
        const arg = args[index];

        if (arg != null && typeof arg === 'object') {
          const [key, value] = toKeyValue(arg);
          args[index] = key;
          args.splice(index + 1, 0, value);
        }
      }

      return doApply(target, that, args);
    },
  });
}
