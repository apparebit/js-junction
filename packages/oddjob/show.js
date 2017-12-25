/* (c) Copyright 2017 Robert Grimm */

import assert from 'assert';

const LOCKED = Symbol('LOCKED');
const INSTRUCTIONS = Symbol('INSTRUCTIONS');

// Instead of requiring an explicit method call to lock the instructions,
// we delay some checks until use but also lock the instructions upon use.
function checkNotLocked(show) {
  assert(!show[LOCKED], `show()'s format cannot be modified after use`);
}

class Show {
  constructor() {
    this[INSTRUCTIONS] = [];
  }

  verbatim(word) {
    checkNotLocked(this);

    this[INSTRUCTIONS].push({ opcode: 'verbatim', word });
    return this;
  }

  length() {
    checkNotLocked(this);

    this[INSTRUCTIONS].push({ opcode: 'length' });
    return this;
  }

  get quoted() {
    checkNotLocked(this);

    this[INSTRUCTIONS].push({ opcode: 'quoted' });
    return this;
  }

  elements(conjunctive = true) {
    checkNotLocked(this);

    const word = conjunctive ? 'and' : 'or';
    this[INSTRUCTIONS].push({ opcode: 'elements', word });
    return this;
  }

  noun(word) {
    checkNotLocked(this);

    this[INSTRUCTIONS].push({ opcode: 'noun', word });
    return this;
  }

  verb(word = 'be') {
    checkNotLocked(this);

    this[INSTRUCTIONS].push({ opcode: 'verb', word });
    return this;
  }

  of(list) {
    this[LOCKED] = true;

    const instructions = this[INSTRUCTIONS];
    const steps = instructions.length;

    const showElements = step => {
      const elements = step > 0 && instructions[step - 1].opcode === 'quoted'
        ? list.map(element => `"${element}"`)
        : list;

      switch( list.length ) {
        case 0:
          return step + 1 < steps && instructions[step + 1].opcode === 'noun'
            ? 'no'
            : 'none';
        case 1:
          return `${elements[0]}`;
        case 2:
          return `${elements[0]} ${instructions[step].word} ${elements[1]}`;
        default:
          return `${
            elements.slice(0, -1).join(', ')
          }, ${
            instructions[step].word
          } ${
            elements[list.length - 1]
          }`;
      }
    };

    let message = '';

    for( let step = 0; step < steps; step++ ) {
      const { opcode, word } = instructions[step];

      switch( opcode ) {
        case 'verbatim':
          if( message ) message += ' ';
          message += `${word}`;
          break;

        case 'length':
          if( message ) message += ' ';
          message += `${list.length}`;
          break;

        case 'quoted':
          assert(step < steps - 1 && instructions[step + 1].opcode === 'elements',
            '"quoted" must be followed by "elements()"');
          break;

        case 'elements':
          if( message ) message += ' ';
          message += showElements(step);
          break;

        case 'noun':
          if( message ) message += ' ';
          message += list.length !== 1 ? `${word}s` : word;
          break;

        case 'verb':
          if( message ) message += ' ';
          if(word === 'be') {
            message += list.length === 1 ? 'is' : 'are';
          } else {
            message += list.length === 1 ? `${word}s` : word;
          }
          break;

        /* istanbul ignore next */
        default:
          assert.fail('unreachable statement');
      }
    }

    return message;
  }
}

export default function show() {
  return new Show();
}
