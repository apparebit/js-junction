/* (C) Copyright 2018 Robert Grimm */

import assert from 'assert';
import { InvalidArgType } from '@grr/oddjob/errors';

const { iterator } = Symbol;

/**
 * Game of Stacks: DATACAST and PARENT grow in the familiar fashion, i.e., by
   adding new elements just past the currently used indices. In contrast,
   PENDING grows from the zero-index by shifting stack elements. While this
   likely loads to slower push and pop operations, it does enable the direct use
   of child arrays from the vDOM, a feature widely used throughout Proact.
 */
const DATACAST = Symbol('datacast');
const EXIT = Symbol('exit');
const PARENT = Symbol('parent');
const PENDING = Symbol('pending');

export function isIgnorable(value) {
  return value == null || value === false || value === true || value === '';
}

export function isTextual(value) {
  const type = typeof value;
  return (type === 'number' || type === 'string') && value !== '';
}

export function isIterable(value) {
  return value != null && typeof value[iterator] === 'function';
}

/**
 * Iterate through the provided children. This generator function effectively
 * treats the array as a work queue identifying child values that still need
 * processing. It also is a stack, with the zero-th element being the top of the
 * stack.
 */
export function* flatten(children, handler = (tag, object) => ({ tag, object }) ) {
  while( children.length ) {
    const value = children.shift();

    if( isIgnorable(value) ) { // --------------------------- (void 0 | null | boolean | '')
      continue;
    } else if( isTextual(value) ) { // ---------------------- Text (Maximal)
      let text = String(value);

      // Don't update `children` — until we recognize a
      // textual, ignorable, or iterable value.
      while( children.length ) {
        const [top] = children;

        if( isIgnorable(top) ) { // ---------------- Ignorable
          children.shift();
        } else if( isTextual(top) ) { // ----------- Textual
          text += children.shift();
        } else if( isIterable(top) ) { // ---------- Iterable
          children.unshift(...children.shift());
        } else {
          break;
        }
      }

      yield handler('text', text);
    } else if( value.isProactNode ) { // -------------------- Enter Node
      yield handler('enter', value);
    } else if( value[EXIT] ) { // --------------------------- Exit Node
      const node = value[EXIT];
      assert(node && node.isProactNode);

      yield handler('exit', node);
    } else if( !isIterable(value) ) { // -------------------- Any Object
      yield handler('any', value);
    } else { // --------------------------------------------- Iterable
      children.unshift(...value);
    }

  }
}

export default function Visitor(handler) {
  if( handler === void 0 ) {
    // Nothing to do.
  } else if( typeof handler === 'function' ) {
    this.handler = handler;
  } else {
    throw InvalidArgType({ handler }, `undefined or a handler function`);
  }
}

Visitor.prototype.setShallowMode = function setShallowMode() {
  this.hasShallowMode = true;
  return this;
};

Visitor.prototype.reset = function reset(value) {
  this[DATACAST] = [];
  this[PARENT] = [];
  this[PENDING] = [value];
  return this;
};

Visitor.prototype.parent = function parent() {
  const stack = this[PARENT];
  return stack[stack.length - 1];
};

Visitor.prototype.traverse = function traverse() {
  for( const { tag, object } of flatten(this[PENDING]) ) {
    let it;

    switch( tag ) {
      case 'text': // --------------------------------------- Text, Enter Node
      case 'enter':
        it = this.handler(tag, object, this.parent());

        if( tag === 'text' ) {
          // Nothing to do.
        } else if( it != null ) { // ---------- [Handle Node Replacement]
          const { value } = it;

          if( typeof value === 'string' || !isIterable(value) ) {
            this[PENDING].unshift(value);
          } else {
            this[PENDING].unshift(...value);
          }
        } else { // --------------------------- [Recurse into Children]
          this[PARENT].push(object);
          if( this.hasShallowMode ) {
            this[PENDING].unshift({ [EXIT]: object });
          } else {
            this[PENDING].unshift(...object.children, { [EXIT]: object });
          }
        }
        break;

      case 'exit': // --------------------------------------- Exit Node
        it = this[PARENT].pop();
        assert(it, object);
        // Fall through.
      case 'any': // ---------------------------------------- Any Object
        this.handler(tag, object, this.parent());
        break;

      /* istanbul ignore next */
      default:
        assert.fail('unreachable statement');
    }
  }

  return this;
};
