/* (C) Copyright 2017 Robert Grimm */

export default function isObject(value) {
  if( value == null ) return false;

  const type = typeof value;
  return type === 'object' || type === 'function';
}
