/* (C) Copyright 2017 Robert Grimm */

export default function isComponent(value) {
  return value != null && typeof value.render === 'function';
}
