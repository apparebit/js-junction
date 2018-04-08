/* (C) Copyright 2018 Robert Grimm */

import Visitor from './visitor';

const { create, keys: keysOf } = Object;
const { formatMany } = Visitor;
const NODES = Symbol('nodes');

export default class Parser extends Visitor {
  constructor(corpus, jsonld) {
    super();
    this.corpus = corpus;
    this.jsonld = jsonld;
    this[NODES] = create(null);
  }

  has(id) { return id in this[NODES]; }
  get(id) { return this[NODES][id]; }

  run() {
    const { '@context': context, '@graph': graph, ...rest } = this.jsonld;

    if( typeof context !== 'string' ) {
      this.emitDiagnostic(`@grr/knowledge supports context references only`);
    } else if( context !== this.corpus.context ) {
      this.emitDiagnostic(`context of corpus "${
        this.corpus.context
      }" different from corpus of document "${
        context
      }"`);
    }

    if( graph != null ) {
      const keys = keysOf(rest);

      if( keys.length !== 0 ) {
        this.emitDiagnostic(
          `JSON-LD document with top-level @graph may only have a @context, but here also has ${
            formatMany(keys.map(k => `"${k}"`))
          } ${
            keys.length === 1 ? 'property' : 'properties'
          }`
        );
      }
    }

    // Actually traverse the JSON document.
    this.dispatch(graph != null ? graph : rest);

    // Return results, i.e., context, nodes, and diagnostics.
    return {
      context,
      nodes: this[NODES],
      diagnostics: this.diagnostics.length > 0 ? this.diagnostics : void 0,
    };
  }

  visitAnyObject(object) {
    if( '@context' in object ) {
      this.emitDiagnostic(`@grr/knowledge does not support JSON-LD's nested contexts`);
    }
    if( '@id' in object && String(object['@id']).startsWith('_:') ) {
      this.emitDiagnostic(`@grr/knowledge does not support JSON-LD's blank node identifiers`);
    }
    return object;
  }

  visitGraph(object) {
    this.emitDiagnostic('@grr/knowledge does not support JSON-LD graph objects');
    return object;
  }

  visitList(object) {
    const flagged = keysOf(object)
      .filter(k => k !== '@context' && k !== '@index' && k !== '@list').map(k => `"${k}"`);

    if( flagged.length > 0 ) {
      this.emitDiagnostic(`@list object with invalid ${
        flagged.length === 1 ? 'property' : 'properties'
      } ${
        formatMany(flagged)
      }`);
    }

    return object;
  }

  visitSet(object) {
    const flagged = keysOf(object)
      .filter(k => k !== '@context' && k !== '@index' && k !== '@set').map(k => `"${k}"`);

    if( flagged.length > 0 ) {
      this.emitDiagnostic(`@set object with invalid ${
        flagged.length === 1 ? 'property' : 'properties'
      } ${
        formatMany(flagged)
      }`);
    }

    return object;
  }

  visitNode(object, keys) {
    // FIXME: Check that root nodes have @id.

    // Leave nodes without @id or with only @id (i.e., references) as they are.
    if( !('@id' in object ) || keys.length === 1 ) return object;

    // Hoist nodes with @id into node map and then replace with reference.
    const { '@id': id } = object;

    // If this JSON-LD document is supposed to join an existing knowledge base,
    // we need to check that corpus for duplicate node definitions as well.
    if( this.corpus != null && this.corpus.has(id) ) {
      this.emitDiagnostic(`duplicate node with @id "${id}" in knowledge base`);
    } else if( this.has(id) ) {
      this.emitDiagnostic(`duplicate node with @id "${id}" in same document`);
    } else {
      this[NODES][id] = object;
    }

    return { '@id': id };
  }
}
