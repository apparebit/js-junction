/* (C) Copyright 2018 Robert Grimm */

import { MalstructuredData } from '@grr/err';
import { asElements, asValue, quote } from '@grr/err/format';
import { constant } from './util';

const { defineProperties } = Object;
const { stringify } = JSON;

// Based on `key` in ancestral records, format property path to offending entity.
function asPath({ ancestors }) {
  const path = [];

  for( const { key } of ancestors ) {
    if( key != null) {
      if( typeof key === 'number' ) {
        path.push(`[${key}]`);
      } else {
        path.push(`['${stringify(key).slice(1, -1)}']`);
      }
    }
  }

  return path.join('');
}

export default class State {
  constructor() {
    this.ancestors = [];
    this.diagnostics = [];
  }

  get current() {
    return this.ancestors[this.ancestors.length - 1];
  }

  isRoot() {
    const visiting = this.ancestors;

    // Any entity is at the document's root if there are (1) no other ancestors
    // or (2) only one ancestor that is an array.
    switch( visiting.length ) {
      case 1:
        return true;
      case 2:
        return visiting[0].kind === 'array';
      default:
        return false;
    }
  }

  hasDiagnostics(count) {
    if( typeof count === 'undefined' ) {
      return this.diagnostics.length > 0;
    } else {
      return this.diagnostics.length === count;
    }
  }

  emitBadDocument(spec) {
    this.diagnostics.push(MalstructuredData(spec));
  }

  emitBadRoot() {
    if( this.ancestors.length < 2 ) {
      this.emitBadDocument(`JSON-LD document places @${this.current.kind} at root`);
    } else {
      this.emitBadValue(`places @${this.current.kind} at root`);
    }
  }

  emitBadValue(spec) {
    this.diagnostics.push(MalstructuredData(`JSON-LD data at path "${asPath(this)}" ${spec}`));
  }
}

defineProperties(State, {
  asElements: constant(asElements),
  asPath: constant(asPath),
  asValue: constant(asValue),
  quote: constant(quote),
});
