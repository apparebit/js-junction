/* (C) Copyright 2018 Robert Grimm */

import { MultipleCallback } from '@grr/oddjob/errors';

// Keys for the traversal control's internal state.
const STATE = Symbol('state');
const VALUE = Symbol('value');

/**
 * The control pane for communicating options back to `traverse()`. An instance
 * of this class is passed to the effects handler when entering a vDOM node. By
 * calling that instance's `skipChildren()` or `replaceChildren()`, the effect
 * handler can either have the node's children skipped or have them replaced
 * with another value. If the effects handler calls neither method, the
 * traversal continues with the node's children.
 */
export default class TraversalControl {
  /** Skip the current node's children. */
  skipChildren() {
    if( this[STATE] ) throw MultipleCallback('control', 'from effects handler');

    this[STATE] = 'skip';
    return this;
  }

  /** Replace the current node's children with the value. */
  replaceChildren(value) {
    if( this[STATE] ) throw MultipleCallback('control', 'from effects handler');

    this[STATE] = 'replace';
    this[VALUE] = value;
    return this;
  }

  /**
   * Accept data from this traversal control and then clear it for the next
   * effects handler invocation.
   */
  accept() {
    const digest = { replace: this[VALUE], skip: this[STATE] === 'skip' };
    this[STATE] = void 0;
    this[VALUE] = void 0;
    return digest;
  }
}
