/* (C) Copyright 2018 Robert Grimm */

const { get, getOwnPropertyDescriptor } = Reflect;

export default function addGraphView(corpus) {
  const wrapped2original = new WeakMap();
  const original2wrapped = new WeakMap();

  const wrap = object => {
    if( object == null || typeof object !== 'object' ) {
      return object;
    } else if( wrapped2original.has(object) ) {
      throw new Error(`object "${object}" is already wrapped for graph view`);
    } else if( !original2wrapped.has(object) ) {
      const readOnlyView = () => {
        throw new Error(`graph view of corpus "${corpus}" is read-only`);
      };

      const wrapped = new Proxy(object, {
        // Enforce read-only semantics of graph view.
        defineProperty: readOnlyView,
        deleteProperty: readOnlyView,
        preventExtensions: readOnlyView,
        set: readOnlyView,
        setPrototypeOf: readOnlyView,

        // Access property, resolve value, and wrap if object.
        get(target, prop, receiver) {
          return wrap(corpus.resolve(get(target, prop, receiver)));
        },

        getOwnPropertyDescriptor(target, prop) {
          const desc = getOwnPropertyDescriptor(target, prop);
          if( desc != null && 'value' in desc ) {
            desc.value = wrap(corpus.resolve(desc.value));
          }
          return desc;
        },
      });

      wrapped2original.set(wrapped, object);
      original2wrapped.set(object, wrapped);
    }

    return original2wrapped.get(object);
  };

  corpus.graph = function graph(id) { return corpus.has(id) ? wrap(corpus.get(id)) : null; };
  corpus.isWrapped = (value) => wrapped2original.has(value);
  corpus.unwrap = (value) => wrapped2original.get(value);
}
