/* (C) Copyright 2018 Robert Grimm */

import assert from 'assert';
import { InvalidArgType, InvalidArgValue, ResourceBusy } from '@grr/err';
import { isIterable } from '@grr/sequitur/types';
import { next, pushAll } from './children';
import { setDriver } from './hook';
import { value } from '@grr/oddjob/descriptors';

const { bind } = Function.prototype;
const { defineProperty } = Object;
const { isArray } = Array;
const { toStringTag } = Symbol;

const CONTEXT = Symbol('context');
const CURRENT = Symbol('current');
const EXIT = Symbol('exit');
const NEW_CONTEXT = Symbol('new-context');
const PARENT = Symbol('parent');
const REPLACE = Symbol('replace');
const SKIP = Symbol('skip');
const TODO = Symbol('todo');

function start(driver, node, parent, context) {
  driver[CURRENT] = true; // Mark driver as busy.
  driver[TODO] = isArray(node) ? node : [node];
  driver[PARENT] = parent;
  driver[CONTEXT] = context;

  driver[SKIP] = void 0;
  driver[REPLACE] = void 0;
  driver[NEW_CONTEXT] = void 0;

  return driver;
}

function enter(driver) {
  // Fill in exit record with old context/parent, then update as necessary.
  const current = driver[CURRENT];
  assert(current != null && (current.isViewElement || current.isViewComponent));

  const op = { [EXIT]: current, parent: driver[PARENT] };
  driver[PARENT] = current;

  if( driver[NEW_CONTEXT] !== void 0 ) {
    op.context = driver[CONTEXT];
    driver[CONTEXT] = driver[NEW_CONTEXT];
    driver[NEW_CONTEXT] = void 0;
  }

  // Push exit record on todo stack before children or their replacements.
  driver[TODO].push(op);

  // Enqueue children or their replacements.
  if( driver[SKIP] !== void 0 ) {
    driver[SKIP] = void 0;
  } else if( driver[REPLACE] !== void 0 ) {
    const replacement = driver[REPLACE];

    if( !isIterable(replacement) || typeof replacement === 'string') {
      driver[TODO].push(replacement);
    } else {
      pushAll(driver[TODO], replacement);
    }

    driver[REPLACE] = void 0;
  } else {
    pushAll(driver[TODO], current.children);
  }
}

function exit(driver) {
  const op = driver[CURRENT];
  assert(op != null && EXIT in op);

  const node = op[EXIT];
  assert(
    node != null
    && (node.isViewElement || node.isViewComponent)
    && node === driver[PARENT]
  );

  driver[PARENT] = op.parent;
  if( op.context ) driver[CONTEXT] = op.context;
}

function* createGenerator(driver, handler) {
  const previous = setDriver(driver);
  try {
    // Make loop-invariant binding from handler to driver.
    const dispatch = bind.call(handler, driver);

    while( true ) {
      const item = driver[CURRENT] = next(driver[TODO]);
      if( item == null ) break;

      if( typeof item === 'string' ) {
        yield dispatch('text', item);
      } else if( item.isViewElement || item.isViewComponent ) {
        yield dispatch('enter', item);
        enter(driver);
      } else if( item[EXIT] ) {
        exit(driver);
        yield dispatch('exit', item[EXIT]);
      } else {
        yield dispatch('unknown', item);
      }
    }
  } finally {
    driver[CURRENT] = void 0;
    setDriver(previous);
  }
}

export default class Driver {
  constructor(handler) {
    if( handler != null ) {
      if( typeof handler !== 'function' ) {
        throw InvalidArgType({ handler }, 'undefined or a function');
      }

      defineProperty(this, 'handle', value(handler, { writable: true }));
    }

    // Fix shape of class.
    this[TODO] = [];             // The stack of pending items.
    this[PARENT] = null;         // The enclosing node.
    this[CONTEXT] = {};          // The current context.
    this[CURRENT] = void 0;      // The current item, popped off todo stack.
    this[SKIP] = void 0;         // True to skip children.
    this[REPLACE] = void 0;      // Items to replace children.
    this[NEW_CONTEXT] = void 0;  // New context object.
  }

  get [toStringTag]() { return 'Proact.Driver'; }
  get context() { return this[CONTEXT]; }
  get parent() { return this[PARENT]; }

  // ===== Generic Traversal =====

  traverse(node, {
    context = {},
    parent = null,
    handler = this.handle,
  } = {}) {
    if( this[CURRENT] !== void 0 ) {
      throw ResourceBusy('Proact driver');
    }

    start(this, node, parent, context);
    return createGenerator(this, handler);
  }

  // ===== Handler =====

  /**
   * Process a node or leaf tagged `enter` before processing a node's children,
   * `exit` thereafter, `text` for a string-valued leaf, and `unknown` for an
   * arbitrary other object.
   */
  handle(tag, object) {
    return { tag, object };
  }

  // ===== Control Pane for Handler =====

  // If an effects handler invokes either skipChildren()/replaceChildren() or
  // provideContext() more than once, it likely is a bug. However, the methods
  // must allow multiple invocations so that an effects handler wrapper can
  // override the original handler's callbacks.

  skipChildren(node) {
    if( node !== this[CURRENT]) {
      throw InvalidArgValue({ node }, `should be "${this[CURRENT]}"`);
    }

    this[SKIP] = true;
    this[REPLACE] = void 0;
    return this;
  }

  replaceChildren(node, children) {
    if( node !== this[CURRENT]) {
      throw InvalidArgValue({ node }, `should be "${this[CURRENT]}"`);
    } else if( children === void 0 ) {
      throw InvalidArgType({ children }, 'not', '"undefined"');
    }

    this[SKIP] = void 0;
    this[REPLACE] = children;
    return this;
  }

  provideContext(node, context) {
    if( node !== this[CURRENT]) {
      throw InvalidArgValue({ node }, `should be "${this[CURRENT]}"`);
    } else if( typeof context !== 'object' ) {
      throw InvalidArgType({ context }, `an object`);
    }

    this[NEW_CONTEXT] = Object(context);
    return this;
  }
}
