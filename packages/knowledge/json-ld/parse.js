/* (C) Copyright 2018 Robert Grimm */

import { forEachPropertyValue } from './values';
import { isPrimitive, kindOf } from './kind';
import { isSchemaOrgContext } from '../semantics/schema-org';
import { MalstructuredData } from '@grr/err';
import { name as PACKAGE } from '../package.json';
import State from './state';
import { URL } from 'url';
import walk from './walk';

const { asElements, asValue, quote } = State;
const { create, keys: keysOf } = Object;
const { isArray } = Array;

const GRAPH_KEYS = { '@context': true, '@graph': true, '@id': true, '@index': true };
const LIST_KEYS = { '@context': true, '@index': true, '@list': true };
const SET_KEYS = { '@context': true, '@index': true, '@set': true };
const VALUE_KEYS =
  { '@context': true, '@index': true, '@language': true, '@type': true, '@value': true };

function checkPropertyKeys(value, state, keys) {
  const superfluous = keysOf(value).filter(k => !keys[k]);

  if( superfluous.length > 0 ) {
    state.emitBadValue(`is a @${
      state.current.kind
    } object with superfluous key${
      superfluous.length !== 1 ? 's' : ''
    } ${
      asElements(quote(superfluous))
    }`);
  }
}

function checkNestedContext(value, state) {
  if( '@context' in value ) {
    state.emitBadValue(`includes nested @context unsupported by ${PACKAGE}`);
  }
}

function checkIdentifier(value, state) {
  const iri = value['@id'];

  if( typeof iri !== 'string' ) {
    state.emitBadValue(`has @id ${asValue(iri)}, which is not an IRI`);
  } else if( iri.startsWith('_:') ) {
    state.emitBadValue(`has blank node identifier "${iri}" unsupported by ${PACKAGE}`);
  }
}

function checkValueIgnoringArray(value, state, label) {
  const areSetAndListAllowed = label === 'array';

  const check = entity => {
    const kind = kindOf(entity);

    switch( kind ) {
      case 'node':
      case 'primitive':
      case 'reference':
      case 'value':
        break;
      case 'list':
      case 'set':
        if( areSetAndListAllowed ) break;
        // Fall through.
      default:
        state.emitBadValue(`is ${
          label
        } with invalid value ${
          asValue(entity)
        },\nwhich should be null, a boolean, number, string, @value, ${
          areSetAndListAllowed ? '@set, @list, ' : ''
        }reference, or node`);
    }
  };

  if( isArray(value) ) {
    for( const element of value ) {
      check(element);
    }
  } else {
    check(value);
  }
}

function createReversePropertyChecker(state) {
  return (value, key, container) => {
    // Normalize a valid URL to the equivalent reference.
    if( typeof value === 'string' ) {
      try {
        value = container[key] = { '@id': new URL(value).href };
      } catch(_) {
        // Nothing to do.
      }
    }

    const kind = kindOf(value);
    if( kind !== 'reference' && kind !== 'node' ) {
      state.ancestors.push({ key });
      state.emitBadValue(
        `is @reverse property value ${asValue(value)} but should be a node, reference, or URL`);
      state.ancestors.pop();
    }
  };
}

const handlers = {
  graph(value, state) {
    state.emitBadValue(`includes nested @graph unsupported by ${PACKAGE}`);
    checkPropertyKeys(value, state, GRAPH_KEYS);
    checkNestedContext(value, state);
  },

  list(value, state) {
    checkPropertyKeys(value, state, LIST_KEYS);
    checkNestedContext(value, state);
    checkValueIgnoringArray(value['@list'], state, '@list');
    if( state.isRoot() ) {
      state.emitBadRoot();
    }
  },

  set(value, state) {
    checkPropertyKeys(value, state, SET_KEYS);
    checkNestedContext(value, state);

    const set = value['@set'];
    checkValueIgnoringArray(set, state, '@set');

    if( state.isRoot() ) {
      state.emitBadRoot();
    } else {
      // The @set isn't at the root and hence must have a parent.
      const { parent } = state.current;

      if( isArray(parent) && isArray(set) ) {
        parent.splice(state.current.key, 1, ...set);
      } else {
        parent[state.current.key] = set;
      }
    }
  },

  value(value, state) {
    checkPropertyKeys(value, state, VALUE_KEYS);
    checkNestedContext(value, state);

    const v = value['@value'];
    if( !isPrimitive(v) ) {
      state.emitBadValue(`is invalid @value ${
        asValue(v)
      }, which is neither null, a boolean, a number, or a string`);
    }

    if( state.isRoot() ) {
      state.emitBadRoot();
    } else if( keysOf(value).length === 1 ) {
      state.current.parent[state.current.key] = v;
    }
  },

  array(value, state) {
    if( !state.isRoot() ) {
      checkValueIgnoringArray(value, state, 'array');
    }
  },

  reference(value, state) {
    checkIdentifier(value, state);
  },

  node(value, state) {
    checkNestedContext(value, state);

    if( '@id' in value ) {
      checkIdentifier(value, state);

      const id = value['@id'];
      if( state.corpus.has(id) ) {
        state.emitBadValue(`is duplicate of node with @id "${id}" in knowledge base`);
      } else if( id in state.nodes ) {
        state.emitBadValue(`is duplicate of node with @id "${id}" in same document`);
      } else {
        state.nodes[id] = value;

        const { key, parent } = state.current;
        if( !state.isRoot() ) {
          parent[key] = { '@id': id };
        }
      }
    } else if( state.isRoot() ) {
      state.emitBadValue(`is a root node without @id`);
    }
  },

  reverse(value, state) {
    /*
     * Upon invocation of the reverse() handler, the parent is guaranteed to be
     * a node, i.e.:
     *
     *     kindOf(state.parent.value) === 'node';
     *
     * The proof is one by elimination of kinds: Primitive values and references
     * cannot have a @reverse property. Arrays might in theory but are only used
     * with numeric indices in this package. Finally, for @graph objects (and
     * similarly for @list, @set, and @value objects), walk() traverses the
     * @graph property but no others. Yet, to invoke this handler, walk() must
     * first traverse the @reverse property, which we just excluded for all
     * kinds besides nodes.
     */
    const { parent } = state;
    if( !('@id' in parent.value ) ) {
      state.emitBadValue(`is the @reverse property of a node without @id`);
    }

    if( value == null || typeof value !== 'object' ) {
      state.emitBadValue(`is a value other than an object`);
    } else {
      const checkReversePropertyValue = createReversePropertyChecker(state);

      for( const key of keysOf(value) ) {
        forEachPropertyValue(value, key, checkReversePropertyValue);
      }
    }
  },

  invalid(value, state) {
    state.emitBadValue(`has value ${asValue(value)}, which is not supported by JSON-LD`);
  },
};

function doParse(value, state) {
  if( value == null || typeof value !== 'object' ) {
    state.emitBadDocument('a JSON-LD document must have a JSON object as content');
    value = { '@id': 'http://example.com/' };
  } else  if( isArray(value ) ) {
    state.emitBadDocument('a JSON-LD document must have a JSON object, not an array, as content');
    value = { '@graph': value };
  }

  const { '@context': context, '@graph': graph, ...rest } = value;
  if( context != null && !isSchemaOrgContext(context) ) {
    state.emitBadDocument(`${PACKAGE} requires @context to be based on Schema.org,\n`
      + `with either @context or @vocab being "http://schema.org/"`);
  }

  let skipped, data;
  if( graph != null ) {
    if( keysOf(rest).length !== 0 ) {
      state.emitBadDocument(
        `a JSON-LD document cannot have both a root node and a @graph of nodes`);
    }

    skipped = '@graph';
    data = graph;
  } else {
    data = rest;
  }

  walk(data, { handlers, skipped, state });
  return state;
}

class ParseState extends State {
  constructor(corpus) {
    super();

    this.corpus = corpus;
    this.context = null;
    this.nodes = create(null);
  }

  /** Parse another JSON-LD document. */
  parse(jsonld) {
    return doParse(jsonld, this);
  }

  /** Move parsed nodes into the corpus, if all parses so far succeeded. */
  transferOnSuccess() {
    if( !this.hasDiagnostics() ) {
      for( const key of keysOf(this.nodes) ) {
        this.corpus.add(this.nodes[key]);
      }
      this.nodes = create(null);
    }
  }

  /** Throw a wrapper error with more errors as `diagnostics`, if some parses so far failed. */
  throwOnFailure() {
    if( this.hasDiagnostics() ) {
      const x = MalstructuredData(`JSON-LD document with ${this.diagnostics.length} errors`);
      x.diagnostics = this.diagnostics;
      throw x;
    }

    return this;
  }
}

/**
 * Parse a JSON-LD document. This function typically is first in a chain of
 * three invocations:
 *
 *     parse(jsonld, knowledge).transferOnSuccess().throwOnFailure();
 *
 * @param {Object} jsonld — The JSON-LD document to parse.
 * @param {Object} corpus — The targeted knowledge base.
 * @param {Object<string,Object>} corpus.nodes - The knowledge base's primary
 * index.
 */
export default function parse(jsonld, corpus) {
  return doParse(jsonld, new ParseState(corpus));
}
