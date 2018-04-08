/* (C) Copyright 2018 Robert Grimm */

import Visitor from './visitor';

const { keys: keysOf } = Object;

export default class Linker extends Visitor {
  constructor(corpus) {
    super();
    this.corpus = corpus;
  }

  run() {
    for( const node of this.corpus.nodes() ) {
      this.dispatch(node);
    }

    return this.corpus;
  }

  visitNode(object, keys) {
    const { '@id': id, '@reverse': reverse } = object;
    if( id == null ) return object;

    // If object resolves to node and doesn't have property key, add that
    // property to resolved node  with reference to node being visited.
    const tryLinkBack = (object, key) => {
      const other = this.corpus.resolve(object);

      if( other != null && typeof other === 'object' && !(key in other) ) {
        other[key] = { '@id': id };
      }
    };

    // Reify @reverse properties if possible.
    if( reverse != null && typeof reverse === 'object' ) {
      for( const key of keysOf(reverse) ) {
        tryLinkBack(reverse[key], key);
      }
    }

    // Reify inverse properties if possible.
    for( const key of keys ) {
      const inverse = this.corpus.inverseOf(key);

      if( inverse != null ) {
        tryLinkBack(object[key], inverse);
      }
    }

    // Done.
    return object;
  }
}
