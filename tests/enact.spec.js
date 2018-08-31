/* (c) Copyright 2018 Robert Grimm */

import { h, html } from '../packages/enact/engines/plain-text.js';
import harness from './harness';

function Adder(...args) {
  return args.reduce((acc, el) => acc + el, 0);
}

export default harness(__filename, t => {
  t.test('engines/plain-text.js', t => {
    t.test('h()', t => {
      // Check that arguments are flattened and filtered.
      t.is(h(Adder), 0);
      t.is(h(Adder, 13), 13);
      t.is(h(Adder, 13, 42), 55);
      t.is(h(Adder, 13, 42, 665), 720);
      t.end();
    });

    t.test('html()', t => {
      // Check that arrays are correctly flattened and that values
      // without display are correctly ignored.
      t.is(
        html`${void 0} ${null} ${false} ${true} ${'Hello'}${[
          null,
          null,
          [[[',']]],
        ]} World!\n    \n`,
        '    Hello, World!\n    \n'
      );

      // Check that unnecessary whitespace is correctly removed.
      t.is(
        html`  \n\t <br>      \n     <br>   `,
        '  \n\t <br>      \n     <br>   '
      );
      t.end();
    });

    t.end();
  });

  t.end();
});
