// /* (C) Copyright 2018 Robert Grimm */

import { addPropertyValue } from './values';
import { inverseOf } from '../semantics/schema-org';
import { kindOf } from './kind';
import State from './state';
import walk from './walk';

const { isArray } = Array;
const { keys: keysOf } = Object;

function doLink(state, from, via, to) {
  from = state.resolve(from);
  if (kindOf(from) === 'node') {
    addPropertyValue(from, via, to);
  }
}

export function addPropertyLink(state, from, via, to) {
  if (isArray(from)) {
    for (const element of from) {
      doLink(state, element, via, to);
    }
  } else {
    doLink(state, from, via, to);
  }
}

const handlers = {
  node(value, state) {
    if (!('@id' in value)) return;

    const ref = { '@id': value['@id'] };
    for (const key of keysOf(value)) {
      const inverse = inverseOf(key);

      if (inverse != null) {
        addPropertyLink(state, value[key], inverse, ref);
      }
    }
  },

  reverse(value, state) {
    const parent = state.parent.value;
    if (!('@id' in parent)) return;

    const ref = { '@id': parent['@id'] };
    for (const key of keysOf(value)) {
      addPropertyLink(state, value[key], key, ref);
    }
  },
};

class LinkerState extends State {
  constructor(corpus) {
    super();
    this.corpus = corpus;
  }

  resolve(entity) {
    return this.corpus.resolve(entity);
  }
}

export default function link(corpus, { state = new LinkerState(corpus) } = {}) {
  for (const node of corpus) {
    walk(node, { handlers, state });
  }
  return state;
}
