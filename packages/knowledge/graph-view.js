/* (C) Copyright 2018 Robert Grimm */

import { nonenumerable } from './json-ld/util';
import { name as PACKAGE } from './package.json';
import { UnsupportedOperation } from '@grr/err';

const { apply, get, getOwnPropertyDescriptor, getPrototypeOf } = Reflect;
const { defineProperty } = Object;
const SECRET = Symbol('graph-view-object');

// Make sure that the get trap below is consistent!
function isGraphView(entity) {
  return entity != null && entity[SECRET];
}

function unsupported() {
  throw UnsupportedOperation(
    `${PACKAGE}'s graph view is read-only and prevents modification`
  );
}

/**
 * Add graph view support to the corpus. This function adds the `graph(id)`
 * method to the instance; the method returns the graph view of the node with
 * `@id`. This function also adds the static `isGraphView(entity)` method if the
 * corpus' class does not have yet a property with that name; the method
 * determines whether the entity is part of the graph view. The implementation
 * of the graph view wraps all objects in JavaScript proxies, forming a somewhat
 * porous read-only membrane. This works because the simplest operation on data,
 * reading a property, also is a necessary first step when resolving a reference
 * or skipping embedded JSON-LD metadata.
 */
export default function addGraphView(corpus) {
  const wrappers = new WeakMap();

  const wrap = value => {
    const type = typeof value;
    if (
      value == null ||
      (type !== 'object' && type !== 'function') ||
      isGraphView(value)
    ) {
      return value;
    }

    let wrapped = wrappers.get(value);
    if (wrapped != null) return wrapped;

    // Note that property descriptors cannot possibly be linked data and thus do
    // not need resolution, though call results, properties, and prototypes may
    // be and thus need resolution.
    wrapped = new Proxy(value, {
      apply: (target, that, args) =>
        wrap(corpus.resolve(apply(target, that, args))),
      construct: unsupported,
      defineProperty: unsupported,
      deleteProperty: unsupported,
      // eslint-disable-next-line arrow-body-style
      get: (target, key, receiver) => {
        return key !== SECRET
          ? wrap(corpus.resolve(get(target, key, receiver)))
          : true;
      },
      getOwnPropertyDescriptor: (target, key) => {
        // For unclear reasons, wrapping a property descriptor does not work;
        // the caller ends up with some unwrapped version. Similarly, deleting a
        // descriptor's `set` property does not work; the called ends up with
        // the descriptor's `set` property having value `undefined`. Instead, we
        // modify the descriptor in place, setting the `value` and `get`
        // properties to wrapped versions and `set` to `undefined`.
        const descriptor = getOwnPropertyDescriptor(target, key);
        if (descriptor == null) return descriptor;

        if ('value' in descriptor) {
          descriptor.value = wrap(descriptor.value);
        } else {
          descriptor.get = wrap(descriptor.get);
          descriptor.set = void 0;
        }
        return descriptor;
      },
      getPrototypeOf: target => wrap(corpus.resolve(getPrototypeOf(target))),
      // has: pass-through,
      // isExtensible: pass-through
      // ownKeys: pass-through,
      preventExtensions: unsupported,
      set: unsupported,
      setPrototypeOf: unsupported,
    });

    wrappers.set(value, wrapped);
    return wrapped;
  };

  defineProperty(
    corpus,
    'graph',
    nonenumerable(function graph(id) {
      return this.has(id) ? wrap(this.get(id)) : null;
    })
  );

  /* istanbul ignore else since we don't test in production. */
  if (__DEV__) defineProperty(corpus, 'wrap', nonenumerable(wrap));

  const { constructor: Knowledge } = corpus;
  if ('isGraphView' in Knowledge) return;

  defineProperty(Knowledge, 'isGraphView', nonenumerable(isGraphView));
}
