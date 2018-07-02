/* (C) Copyright 2018 Robert Grimm */

import { isInvalid, isPrimitive, isValue, kindOf } from './kind';
import { InvalidArgType, InvalidArgValue } from '@grr/err';

const { is, keys: keysOf } = Object;
const { isArray } = Array;

/**
 * Execute the `callback` for each value of `object`'s `key` property. This
 * function iteratively invokes the callback over the elements of an
 * array-valued property, while simply invoking the callback on any other value.
 * For an array-valued property, the callback is invoked as:
 *
 *     callback(element, index, array, key, object);
 *
 * In contrast, for any other value, the callback is invoked as:
 *
 *     callback(value, key, object);
 *
 * As suggested by the `forEach` prefix of the function name, callbacks must
 * be synchronous.
 */
export function forEachPropertyValue(object, key, callback) {
  const values = object[key];

  if (isArray(values)) {
    for (let index = 0; index < values.length; index++) {
      callback(values[index], index, values, key, object);
    }
  } else {
    callback(values, key, object);
  }
}

/**
 * Determine whether the two values are equal, which is the case if both values
 * are (1) null, the same boolean, number, or string, (2) @value objects with
 * the same @language, @type, and @value, or (3) references or nodes with the
 * same @id.
 *
 * @param {*} value1 — The first value to compare.
 * @param {*} value2 — The second value to compare.
 * @returns {boolean}
 */
export function areEqual(value1, value2) {
  if (isPrimitive(value1) || isPrimitive(value2)) {
    return is(value1, value2);
  } else if (isInvalid(value1) || isInvalid(value2)) {
    return false;
  } else if (isValue(value1) || isValue(value2)) {
    // @value object values are null, boolean, number, or string.
    // `===` doesn't do the right thing for NaN, whereas `is()` does.
    return (
      is(value1['@value'], value2['@value']) &&
      value1['@type'] === value2['@type'] &&
      value1['@language'] === value2['@language']
    );
  } else {
    // To appear in more than one property, a node must be referencable
    // and therefore must have proper `@id`, which equals itself (duh).
    const id1 = value1['@id'];
    return typeof id1 === 'string' && id1 === value2['@id'];
  }
}

/**
 * Add the value to the node's property with the given key. If the property does
 * not yet exist or does not yet have the value, according to `areEqual()`
 * above, this function adds the property value. That value must be null, a
 * boolean, a number, a string, a node reference, or a @value object.
 *
 * @param {Object} node - The node.
 * @param {string} key - The property name.
 * @param {*} value - The value, which must be null, a boolean, a number, a
 *   string, a node reference, or a @value object.
 */
export function addPropertyValue(node, key, value) {
  if (kindOf(node) !== 'node') {
    throw InvalidArgValue({ node }, 'is not a JSON-LD node');
  } else if (typeof key !== 'string') {
    throw InvalidArgType({ key }, 'a string');
  }

  const kind = kindOf(value);
  if (kind === 'primitive') {
    // Nothing to do.
  } else if (kind === 'reference') {
    const { '@id': id } = value;
    if (typeof id !== 'string') {
      throw InvalidArgValue(
        { value },
        'is a reference with non-string identifier'
      );
    } else if (id.startsWith('_:')) {
      throw InvalidArgValue(
        { value },
        'is a reference with unsupported blank identifier'
      );
    }
  } else if (kind === 'value') {
    if (kindOf(value['@value']) !== 'primitive') {
      throw InvalidArgValue(
        { value },
        'is an invalid @value due not having null, a boolean, a number, or a string as value'
      );
    } else if (keysOf(value).length === 1) {
      value = value['@value'];
    }
  } else {
    throw InvalidArgValue(
      { value },
      'should be a null, a boolean, a number, a string, a @value, or a node reference'
    );
  }

  const old = node[key];
  if (!(key in node)) {
    node[key] = value;
  } else if (!isArray(old)) {
    if (!areEqual(old, value)) {
      node[key] = [old, value];
    }
  } else if (old.every(element => !areEqual(element, value))) {
    old.push(value);
  }
}
