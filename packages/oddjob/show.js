/* (c) Copyright 2017 Robert Grimm */

import assert from 'assert';

const LOCKED = Symbol('LOCKED');
const INSTRUCTIONS = Symbol('INSTRUCTIONS');

// Instead of requiring an explicit method call to lock the instructions,
// we delay some checks until use but also lock the instructions upon use.
function check(show) {
  assert(!show[LOCKED], `show()'s format cannot be modified after use`);
}

class Show {
  constructor() {
    this[INSTRUCTIONS] = [];
  }

  verbatim(word) {
    check(this);

    this[INSTRUCTIONS].push({ opcode: 'verbatim', word });
    return this;
  }

  length() {
    check(this);

    this[INSTRUCTIONS].push({ opcode: 'length' });
    return this;
  }

  get quoted() {
    check(this);

    this[INSTRUCTIONS].push({ opcode: 'quoted' });
    return this;
  }

  elements(conjunctive = true) {
    check(this);

    const word = conjunctive ? 'and' : 'or';
    this[INSTRUCTIONS].push({ opcode: 'elements', word });
    return this;
  }

  noun(word) {
    check(this);

    this[INSTRUCTIONS].push({ opcode: 'noun', word });
    return this;
  }

  verb(word = 'be') {
    check(this);

    this[INSTRUCTIONS].push({ opcode: 'verb', word });
    return this;
  }

  of(list) {
    this[LOCKED] = true;

    const instructions = this[INSTRUCTIONS];
    const steps = instructions.length;

    let message = '';

    for(let step = 0; step < steps; step++) {
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

        case 'elements': {
          if( message ) message += ' ';

          const elements = step && instructions[step - 1].opcode === 'quoted'
            ? list.map(element => `"${element}"`)
            : list;

          switch( list.length ) {
            case 0:
              message += step < steps - 1 && instructions[step + 1].opcode === 'noun'
                ? 'no'
                : 'none';
              break;
            case 1:
              message += `${elements[0]}`;
              break;
            case 2:
              message += `${elements[0]} ${word} ${elements[1]}`;
              break;
            default:
              message += `${
                elements.slice(0, list.length - 1).join(', ')
              }, ${
                word
              } ${
                elements[list.length - 1]
              }`;
          }
        } break;

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
