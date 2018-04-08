/* (C) Copyright 2018 Robert Grimm */

import { inspect } from 'util';

const DIAGNOSTICS = Symbol('diagnostics');
const INFLIGHT = Symbol('inflight');
const { isArray } = Array;
const { keys: keysOf } = Object;

const SIMPLE_NAME = /[A-Za-z_][A-Za-z0-9_]*/u;

function toPropertyRef(keys) {
  const path = [];

  for( const key of keys ) {
    if( typeof key === 'number' ) {
      path.push(`[${key}]`);
    } else if( SIMPLE_NAME.test(key) ) {
      path.push(`.${key}`);
    } else {
      path.push(`["${key.replace(/\\"/u, '\\$&')}"]`);
    }
  }

  return path.join('');
}


const MAX_TEXT_LENGTH = 97;

export default class Visitor {
  constructor() {
    this[DIAGNOSTICS] = [];
    this[INFLIGHT] = [];
  }

  dispatch(object) {
    if( object == null || typeof object !== 'object' ) {
      return this.visitLiteral(object);
    } else if( isArray(object) ) {
      object = this.visitArray(object);

      for( let key = 0; key < object.length; key++ ) {
        const processed = object[key] = this.dispatchWithTrace(key, object[key]);
        if( processed == null ) object.splice(key--, 1);
      }

      return object.length > 0 ? object : null;
    }

    object = this.visitAnyObject(object);
    const keys = keysOf(object);

    let result;
    if( '@graph' in object ) {
      result = this.visitGraph(object, keys);
    } else if( '@list' in object ) {
      result = this.visitList(object, keys);
    } else if( '@set' in object ) {
      result = this.visitSet(object, keys);
    } else if( '@value' in object ) {
      result = this.visitValue(object, keys);
    } else {
      result = this.visitNode(object, keys);
    }

    for( const key of keys ) {
      const processed = object[key] = this.dispatchWithTrace(key, object[key]);
      if( processed == null ) delete object[key];
    }

    return result;
  }

  dispatchWithTrace(key, value) {
    this[INFLIGHT].push({ key });
    try {
      // eslint-disable-next-line no-use-before-define
      return this.dispatch(value);
    } finally {
      this[INFLIGHT].pop();
    }
  }

  visitLiteral(object) { return object; }
  visitArray(object) { return object; }
  visitAnyObject(object) { return object; }
  visitGraph(object) { return object; }
  visitList(object) { return object; }
  visitSet(object) { return object; }
  visitValue(object) { return object; }
  visitNode(object) { return object; }

  emitDiagnostic(message, label = 'error') {
    this[DIAGNOSTICS].push({ label, property: toPropertyRef(this[INFLIGHT]), message });
  }

  get diagnostics() { return this[DIAGNOSTICS]; }

  static formatMany(list, junction = 'and') {
    switch(list.length) {
      case 0:
        return '';
      case 1:
        return list[0];
      case 2:
        return `${list[0]} ${junction} ${list[1]}`;
      default:
        return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
    }
  }

  static formatValue(value) {
    const text = inspect(value);
    return text.length <= MAX_TEXT_LENGTH ? text : `${text.slice(0, MAX_TEXT_LENGTH)}...`;
  }
}
