/* (C) Copyright 2018 Robert Grimm */

import Visitor from './visitor';
import StringWriter from './string-writer';

const { assign, create } = Object;
const { toStringTag } = Symbol;

/**
 * The driver for rendering the vDOM to a string relies on something akin to
 * mixin composition to support both vDOM traversal ({@link Visitor}) and
 * buffered output ({@link StringWriter}). This mostly just works. However, as
 * illustrated for {@link #reset} below, manual conflict resolution gets tedious
 * real fast.
 */
export function StringRenderer(handler) {
  Visitor.call(this, handler);
  StringWriter.call(this);
}

StringRenderer.prototype = assign(create(null, {
  [toStringTag]: { value: 'Proact.Driver.StringRenderer' },
}), Visitor.prototype, StringWriter.prototype);

StringRenderer.prototype.constructor = StringRenderer;

StringRenderer.prototype.reset = function reset(...args) {
  Visitor.prototype.reset.call(this, ...args);
  StringWriter.prototype.reset.call(this, ...args);
  return this;
};
