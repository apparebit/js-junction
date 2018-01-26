/* (C) Copyright 2018 Robert Grimm */

/**
 * Making actual use of the vDOM typically requires traversing the corresponding
 * nodes and instigating some effects. Proact's driver architecture is based on
 * the observation that the traversal itself is generic and should be
 * implemented once, whereas the effects are task-specific and should be
 * implemented with as little boilerplate as possible. The implementation
 * realizes the architecture by providing a generator function `traverse()`,
 * which ensures that traversal is lazy — discharging small units of work on
 * demand — and suspendable — a critical concern for an asynchronous system.
 *
 * @module @grr/proact/driver/traverse
 */

import assert from 'assert';
import { isIgnorable, isIterable, isTextual } from './kinds';
import TraversalControl from './traversal-control';

const { isArray } = Array;

// Marker for queued exit record, which avoids wrapping all child values.
const EXIT = Symbol('exit');

/** Push the elements of `source` in reverse order onto the `target` stack. */
function pushInReverse(target, source) {
  for( let index = source.length - 1; index >= 0; index-- ) {
    target.push(source[index]);
  }
  return target;
}

/**
 * The effect handler for a vDOM traversal.
 *
 * @callback EffectHandler
 * @param {string} tag - The state, which is `text`, `enter`, `exit`, or `unknown`.
 * @param {*} value - The child value.
 * @param {Node} parent - The parent node of the value.
 * @param {TraversalControl} [control] - The traversal control,
 *     which is only available with an `enter` invocation.
 * @returns {*} An arbitrary value, to be yielded by `traverse()`.
 */

/**
 * Traverse the values queued up in the `todo` stack. For each textual value,
 * entry into a node, exit from a node, and unknown object, a generator created
 * by this generator function invokes the effects handler and then yields the
 * handler's result. To reduce the need for imperative code as much as possible,
 * e.g., when rendering the vDOM as HTML, values returned from an effect handler
 * invocation are yielded as is. An explicit
 * {@link TraversalControl traversal control} provides a structured interface
 * for controlling the traversal from the effects handler.
 *
 * @param {Array} todo - The stack of values that still need to be traversed.
 * @param {Object} options - The options for this traversal.
 * @param {Node[]} [options.ancestors=[]] - Stack for tracking parent node.
 * @param {boolean} [options.recurse=true] - Flag for recursing into children.
 * @param {EffectHandler} [options.handler] - The effect handler for traversal.
 * @yields {*} The result of the last effect handler invocation.
 */
export default function* traverse(todo, {
  ancestors = [],
  recurse = true,
  handler = (tag, object) => ({ tag, object }),
} = {}) {
  const control = new TraversalControl();

  while( todo.length ) {
    const value = todo.pop();
    const parent = ancestors[ancestors.length - 1];

    if( isIgnorable(value) ) { // --------------------------------- Ignorable
      continue;
    } else if( isTextual(value) ) { // ---------------------------- Textual
      let text = String(value);

      while( todo.length ) {
        // Only consume top if it is ignorable, textual, or iterable.
        const top = todo[todo.length - 1];

        if( isIgnorable(top) ) { // ---------------- Ignorable
          todo.pop();
        } else if( isTextual(top) ) { // ----------- Textual
          text += todo.pop();
        } else if( isIterable(top) ) { // ---------- Iterable
          pushInReverse(todo, [...todo.pop()]);
        } else {
          break;
        }
      }

      yield handler('text', text, parent);
    } else if( value.isProactNode ) { // -------------------------- Enter Node
      yield handler('enter', value, parent, control);
      const { skip, replace } = control.accept();

      ancestors.push(value);
      todo.push({ [EXIT]: value });

      if( replace != null ) {
        if( typeof replace === 'string' || !isIterable(replace) ) {
          todo.push(replace);
        } else if( isArray(replace) ) {
          pushInReverse(todo, replace);
        } else {
          pushInReverse(todo, [...replace]);
        }
      } else if( !skip && recurse ) {
        pushInReverse(todo, value.children);
      }
    } else if( value[EXIT] ) { // --------------------------------- Exit Node
      const node = value[EXIT];
      ancestors.pop(); // By definition, same as parent.
      assert(node && node.isProactNode && node === parent);

      yield handler('exit', node, parent);
    } else if( !isIterable(value) ) { // -------------------------- Unknown Object
      yield handler('unknown', value, parent);
    } else if( isArray(value) ) { // ------------------------------ Iterable
      pushInReverse(todo, value);
    } else {
      pushInReverse(todo, [...value]);
    }
  }
}
