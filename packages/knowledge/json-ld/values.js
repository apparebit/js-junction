/* (C) Copyright 2018 Robert Grimm */

const { is, keys: keysOf } = Object;
const { isArray } = Array;

export function isPrimitive(entity) {
  const type = typeof entity;
  return entity === null || type === 'boolean' || type === 'number' || type === 'string';
}

export function isObject(entity) {
  return entity != null && typeof entity === 'object' && !isArray(entity);
}

export function isGraph(entity) {
  return '@graph' in entity;
}

export function isList(entity) {
  return '@list' in entity;
}

export function isSet(entity) {
  return '@set' in entity;
}

export function isValue(entity) {
  return '@value' in entity;
}

export function isListOrSet(entity) {
  return '@list' in entity || '@set' in entity;
}

export function isReference(entity, keys = keysOf(entity)) {
  return '@id' in entity && keys.length === 1;
}

export function isBlankNodeId(id) {
  return typeof id === 'string' && id.startsWith('_:');
}

export function hasProperty(container, key) {
  const value = container[key];
  return value != null && (!isArray(value) || value.length > 0);
}

export function areEqual(value1, value2) {
  if( isPrimitive(value1) || isPrimitive(value2) ) {
    return is(value1, value2);
  } else if( !isObject(value1) || !isObject(value2) ) {
    return false;
  }

  if( isValue(value1) || isValue(value2) ) {
    // Value object values must be primitive, so is() it is.
    return is(value1['@value'], value2['@value'])
      && value1['@type'] === value2['@type']
      && value1['@language'] === value2['@language'];
  } else {
    // To appear in more than one property, a node must be referencable
    // and therefore must have proper `@id`, which equals itself (duh).
    const id1 = value1['@id'];
    return typeof id1 === 'string' && id1 === value2['@id'];
  }
}
