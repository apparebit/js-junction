/* (c) Copyright 2018 Robert Grimm */

import {
  EmptyIterator,
  isIterable,
  isIterator,
  IteratorPrototype,
  toIteratorFactory,
} from '@grr/sequitur/types';

import harness from './harness';

const { create, getPrototypeOf } = Object;
const { iterator } = Symbol;

export default harness(__filename, t => {
  t.test('types', t => {
    t.test('EmptyIterator', t => {
      t.ok(isIterable(EmptyIterator));
      t.ok(isIterator(EmptyIterator));
      t.is(getPrototypeOf(EmptyIterator), IteratorPrototype);

      const { value, done } = EmptyIterator.next();
      t.is(value, void 0);
      t.is(done, true);

      t.end();
    });

    t.test('.isIterable()', t => {
      t.notOk(isIterable(void 0));
      t.notOk(isIterable(null));
      t.notOk(isIterable(false));
      t.notOk(isIterable(true));
      t.notOk(isIterable(665));
      t.notOk(isIterable({}));

      t.ok(isIterable(''));
      t.ok(isIterable([]));
      t.ok(isIterable((function* gen() {})()));
      t.ok(isIterable(new Map()));
      t.ok(isIterable(new Set()));

      t.ok(isIterable({
        [iterator]() { return { next() { return { done: true }; }}; },
      }));

      t.ok(isIterable({
        [iterator]() { return this; },
        next() { return { done: true }; },
      }));

      t.end();
    });

    t.test('.isIterator()', t => {
      t.notOk(isIterator(void 0));
      t.notOk(isIterator(null));
      t.notOk(isIterator(false));
      t.notOk(isIterator(true));
      t.notOk(isIterator(665));
      t.notOk(isIterator({}));

      t.ok(isIterator(''[iterator]()));
      t.ok(isIterator([][iterator]()));
      t.ok(isIterator((function* gen() {})()));

      t.ok(isIterator({
        [iterator]() { return { next() { return { done: true }; }}; },
      }[iterator]()));

      t.ok(isIterator({
        [iterator]() { return this; },
        next() { return { done: true }; },
      }));

      t.end();
    });

    t.test('IteratorPrototype()', t => {
      const iter = create(IteratorPrototype, {
        next: { value: () => ({ done: true })}
      });

      t.ok(isIterable(iter));
      t.ok(isIterator(iter));
      t.end();
    });

    t.test('toIteratorFactory()', t => {
      const NUMBERS = [42, 665, 13];
      let make = toIteratorFactory(NUMBERS[iterator]());
      t.same([...make()], NUMBERS);
      t.same([...make()], NUMBERS);

      const iter = NUMBERS[iterator]();
      make = toIteratorFactory({ next() { return iter.next(); } });
      t.same([...make()], NUMBERS);
      t.same([...make()], NUMBERS);


      t.end();
    });

    t.end();
  });

  t.end();
});
