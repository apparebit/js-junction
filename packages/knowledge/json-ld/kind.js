/* (C) Copyright 2018 Robert Grimm */

import { constant } from './util';

const { defineProperty } = Reflect;
const { keys: keysOf } = Object;
const { isArray } = Array;

/**
 * Determine whether the entity is a primitive JSON-LD value, i.e., `null`, a
 * boolean, a number, or a string.
 *
 * @param {*} entity — The entity to check.
 * @param {string} type — The `typeof` entity.
 * @returns {boolean}
 */
export function isPrimitive(entity, type = typeof entity) {
  return entity === null || type === 'boolean' || type === 'number' || type === 'string';
}

/**
 * Determine whether the entity is not a valid JSON-LD value. This function must
 * not be invoked on an entity unless `isPrimitive()` has already returned
 * `false`.
 *
 * @param {*} entity — The entity to check.
 * @param {*} type — The `typeof` entity.
 * @returns {boolean}
 */
export function isInvalid(entity, type = typeof entity) {
  return type === 'undefined' || type !== 'object';
}

/**
 * Determine whether the entity is a valid JSON-LD @value object. This function must
 * not be invoked on an entity unless `isPrimitive()` and `isInvalid()` have already
 * returned `false`.
 *
 * @param {*} entity — The entity to check.
 * @returns {boolean}
 */
export function isValue(entity) {
  return '@value' in entity;
}

/**
 * Determine the kind of the JSON-LD object. This function must not be invoked
 * on a value unless `typeof entity === 'object'`. That condition is met if both
 * `isPrimitive()` and `isInvalid()` have already returned `false`.
 *
 * @param {object} entity — The entity to check.
 * @returns {string} The kind.
 */
export function kindOfObject(entity) {
  if( isArray(entity) ) {
    return 'array';
  } else if( '@graph' in entity ) {
    return 'graph';
  } else if( '@list' in entity ) {
    return 'list';
  } else if( '@set' in entity ) {
    return 'set';
  } else if( isValue(entity) ) {
    return 'value';
  } else if( '@id' in entity && keysOf(entity).length === 1 ) {
    return 'reference';
  } else {
    return 'node';
  }
}

const KIND = Symbol('@kind');

/**
 * Determine the kind of JSON-LD value. If the entity is a JavaScript object,
 * this function uses a non-enumerable property  with a symbol as key to memoize
 * the result of testing the object for several different properties, thus
 * speeding up future calls. If an application modifies an object as to also
 * change its kind, it should invoke this function with `true` as the second
 * argument to forcibly recompute the memoized value.
 *
 * @param {*} entity — The entity.
 * @param {boolean} forced — The flag for recomputing the kind.
 * @returns {string} The kind.
 */
export function kindOf(entity, forced = false) {
  const type = typeof entity;

  if( isPrimitive(entity, type) ) {
    return 'primitive';
  } else if( isInvalid(entity, type) ) {
    return 'invalid';
  } else if( !forced && typeof entity[KIND] === 'string' ) {
    return entity[KIND];
  } else {
    const kind = kindOfObject(entity);
    defineProperty(entity, KIND, constant(kind));

    return kind;
  }
}
