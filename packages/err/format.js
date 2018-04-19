/* (c) Copyright 2018 Robert Grimm */

import { inspect } from 'util';

const { isArray } = Array;

export function quote(value) {
  return isArray(value) ? value.map(quote) : `"${value}"`;
}

export function asArgId(id) {
  return typeof id === 'number' ? `#${id}` : `"${String(id)}"`;
}

export function asValue(value) {
  let s = inspect(value, { compact: true, depth: Infinity });
  if( s.length > 96 ) s = `${s.slice(0, 96)} ...`;
  return `"${s}"`;
}

export function asElements(array, junction = 'and') {
  switch( array.length ) {
    case 0:
      return '';
    case 1:
      return array[0];
    case 2:
      return `${array[0]} ${junction} ${array[1]}`;
    default:
      return `${array.slice(0, -1).join(', ')}, ${junction} ${array[array.length - 1]}`;
  }
}
