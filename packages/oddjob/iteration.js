/* (C) Copyright 2018 Robert Grimm */

const { getPrototypeOf } = Object;
const { iterator } = Symbol;

export const IteratorPrototype = getPrototypeOf(getPrototypeOf([][iterator]()));

export function isIterable(value) {
  return value != null && typeof value[iterator] === 'function';
}

export function isIterator(value) {
  return value != null && typeof value.next === 'function';
}
