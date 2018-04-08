/* (C) Copyright 2018 Robert Grimm */

import addGraphView from './graph-view';
import Parser from './syntax/parser';
import Linker from './syntax/linker';
import { isSchemaOrgContext, inverseOf } from './semantics/schema-org';

const { create, keys, values } = Object;
const CONTEXT = Symbol('context');
const NODES = Symbol('nodes');

export default class Knowledge {
  constructor(context) {
    this[CONTEXT] = Knowledge.toContext(context);
    this[NODES] = create(null);

    // @grr/knowledge ❤️ Schema.org!
    if( isSchemaOrgContext(context) ) this.inverseOf = inverseOf;

    // Inject graph(id), isWrapped(value), and unwrap(value) for graph view.
    addGraphView(this);
  }

  // ==================== Ingesting JSON-LD ====================

  parse(json) {
    const { nodes, diagnostics } = new Parser(this, json).run();

    if( diagnostics ) {
      const x = new SyntaxError(`JSON-LD with ${diagnostics.length} diagnostics`);
      x.diagnostics = diagnostics;
      throw x;
    }

    for( const id of keys(nodes) ) {
      this[NODES][id] = nodes[id];
    }
  }

  inverseOf(_) { return null; }

  link() { new Linker(this).run(); }

  // ==================== Accessing the Graph ====================

  get context() { return this[CONTEXT]; }

  has(id) { return id in this[NODES]; }
  get(id) { return this[NODES][id]; }

  nodes() { return values(this[NODES]); }
  [Symbol.iterator]() { return this.nodes(); }

  /**
   * Resolve the JSON-LD property value. For @id references that are defined by
   * this knowledge base, this method returns the corresponding node object. For
   * @list, @set, and @value objects, this method transparently skips over the
   * meta-property and returns the result of resolving the actual value. This
   * method still exposes @reverse meta-properties, though they are reversed
   * during ingestion if possible.
   */
  resolve(value) {
    if( value == null || typeof value !== 'object' ) return value;

    if( Knowledge.isReference(value) ) {
      const { '@id': id } = value;
      return this.has(id) ? this.get(id) : value;
    } else if( '@list' in value ) {
      return this.resolve(value['@list']);
    } else if( '@set' in value ) {
      return this.resolve(value['@set']);
    } else if( '@value' in value ) {
      return this.resolve(value['@value']);
    } else {
      return value;
    }
  }

  // ==================== Dealing with JSON-LD @ids ====================

  static hasId(object) {
    return object != null && typeof object['@id'] === 'string';
  }

  static isReference(object) {
    return Knowledge.hasId(object) && keys(object).length === 1;
  }

  static isBlankNodeId(id) {
    return String(id).startsWith('_:');
  }

  // ==================== Dealing Context References ====================

  static toContext(url) {
    url = String(url);
    return url === 'http://schema.org' ? 'http://schema.org/' : url;
  }
}
