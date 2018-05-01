/* (C) Copyright 2018 Robert Grimm */

import addGraphView from './graph-view';
import { addPropertyValue } from './json-ld/values';
import { DuplicateBinding, InvalidArgType, InvalidArgValue } from '@grr/err';
import { kindOf } from './json-ld/kind';
import crosslink from './json-ld/link';
import parse from './json-ld/parse';

const { create, keys: keysOf } = Object;
const { iterator } = Symbol;
const NODES = Symbol('nodes');

/** In-memory representation of a corpus or knowledge base. */
export default class Knowledge {
  constructor() {
    this[NODES] = create(null);
    addGraphView(this); // This function adds functionality.
  }

  // ===== Populating This Knowledge Base =====

  add(node) {
    const kind = kindOf(node);
    if( kind !== 'node' ) {
      throw new InvalidArgType({ node }, 'a JSON-LD node with @id');
    } else if( !('@id' in node) ) {
      throw new InvalidArgValue({ node }, 'should have an @id');
    } else if( node['@id'] in this[NODES] ) {
      throw new DuplicateBinding('@id', this[NODES][node['@id']], node);
    }

    this[NODES][node['@id']] = node;
    return this;
  }

  addPropertyValue(node, key, value) {
    addPropertyValue(node, key, value);
    return this;
  }

  ingest(jsonld) {
    parse(jsonld, this).throwOnFailure().transferOnSuccess();
    return this;
  }

  link() {
    crosslink(this);
    return this;
  }

  // ===== Consulting This Knowledge Base =====

  has(id) { return id in this[NODES]; }
  get(id) { return this[NODES][id]; }

  * entries() {
    for( const key of keysOf(this[NODES]) ) {
      yield [key, this[NODES][key]];
    }
  }

  * values() {
    for( const key of keysOf(this[NODES]) ) {
      yield this[NODES][key];
    }
  }

  [iterator]() { return this.values(); }

  /**
   * Resolve the entity by trying to resolve references to nodes in this
   * knowledge base and by skipping the embedded metadata of @graph, @list,
   * @set, and @value objects. This function must be conservative in that, if it
   * does not recognize an entity, it must return said entity.
   */
  resolve(entity) {
    switch( kindOf(entity) ) {
      case 'reference': {
        const { '@id': id } = entity;
        return this.has(id) ? this.get(id) : entity;
      }
      case 'graph':
        return this.resolve(entity['@graph']);
      case 'list':
        return this.resolve(entity['@list']);
      case 'set':
        return this.resolve(entity['@set']);
      case 'value':
        return this.resolve(entity['@value']);
      default:
        return entity;
    }
  }
}
