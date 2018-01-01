/* (c) Copyright 2017 Robert Grimm */

const { isArray } = Array;

export default function isElement(value) {
  return value != null
    && typeof value.name === 'string'
    && typeof value.attributes === 'object'
    && isArray(value.children);
}
