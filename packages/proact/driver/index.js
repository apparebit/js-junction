/* (C) Copyright 2018 Robert Grimm */

import { InvalidArgType } from '@grr/oddjob/errors';
import { isIterable } from './kinds';
import doTraverse from './traverse';

const { toStringTag } = Symbol;

/**
 * The driver for vDOM traversals. This class may be instantiated on its own. In
 * that case, the constructor must be invoked with an effects handler as its
 * only argument and binds the function to the instance. Alternatively, this
 * class can be instantiated through a subclass that invokes the constructor
 * with no arguments and overrides the `createHandler()` method to return an
 * appropriate effects handler.
 */
export default class Driver {
  constructor(handler) {
    const type = typeof handler;

    if( type === 'function' ) {
      this.handler = handler.bind(this);
    } else if( type !== 'undefined' ) {
      throw InvalidArgType({ handler }, 'undefined or a function');
    }
  }

  get [toStringTag]() {
    return 'Proact.Driver';
  }

  /** Create a handler bound to an appropriate context. */
  createHandler() {
    return this.handler;
  }

  /** Mark the start of a traversal with the handler just created by the factory. */
  traversalWillStart(handler) { // eslint-disable-line no-unused-vars
    // Nothing to do (yet).
  }

  /** Traverse over the vDOM. */
  * traverse(value, options) {
    const stack = isIterable(value) ? [...value].reverse() : [value];
    const handler = this.createHandler();

    this.traversalWillStart(handler);
    try {
      yield* doTraverse(stack, { handler, ...options });
    } finally {
      this.traversalDidEnd(handler);
    }
  }

  /** Mark the end of the traversal with the handler. */
  traversalDidEnd(handler) { // eslint-disable-line no-unused-vars
    // Nothing to do (yet).
  }
}
