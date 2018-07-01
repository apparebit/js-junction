/* (c) Copyright 2018 Robert Grimm */

import {
  EmptyIterator,
  isGeneratorFunction,
  isIterable,
  isIterator,
  IteratorPrototype,
  toIteratorFactory,
} from '@grr/sequitur/iterations';

import harness from './harness';

const { create, getOwnPropertyDescriptors, getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;

export default harness(__filename, t => {
  t.test('iterations', t => {
    t.test('.isGeneratorFunction()', t => {
      t.notOk(isGeneratorFunction(void 0));
      t.notOk(isGeneratorFunction(null));
      t.notOk(isGeneratorFunction(false));
      t.notOk(isGeneratorFunction(true));
      t.notOk(isGeneratorFunction(665));
      t.notOk(isGeneratorFunction({}));
      t.notOk(isGeneratorFunction(function fn() {}));
      t.notOk(isGeneratorFunction(() => {}));

      t.ok(isGeneratorFunction(function* gen() {}));
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

      t.ok(
        isIterable({
          [iterator]() {
            return {
              next() {
                return { done: true };
              },
            };
          },
        }),
      );

      t.ok(
        isIterable({
          [iterator]() {
            return this;
          },
          next() {
            return { done: true };
          },
        }),
      );

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

      t.ok(
        isIterator(
          {
            [iterator]() {
              return {
                next() {
                  return { done: true };
                },
              };
            },
          }[iterator](),
        ),
      );

      t.ok(
        isIterator({
          [iterator]() {
            return this;
          },
          next() {
            return { done: true };
          },
        }),
      );

      t.end();
    });

    t.test('IteratorPrototype()', t => {
      const iter = create(IteratorPrototype, {
        next: { value: () => ({ done: true }) },
      });

      t.ok(isIterable(iter));
      t.ok(isIterator(iter));

      t.end();
    });

    t.test('EmptyIterator', t => {
      t.ok(isIterable(EmptyIterator));
      t.ok(isIterator(EmptyIterator));
      t.is(getPrototypeOf(EmptyIterator), IteratorPrototype);

      const descriptors = getOwnPropertyDescriptors(EmptyIterator);
      ['next', toStringTag].forEach(name =>
        ['configurable', 'enumerable', 'writable'].forEach(prop =>
          t.notOk(descriptors[name][prop]),
        ),
      );

      const { value, done } = EmptyIterator.next();
      t.is(value, void 0);
      t.is(done, true);

      t.end();
    });

    t.test('toIteratorFactory()', t => {
      const NUMBERS = [42, 665, 13];

      // (if-else clause 1) No argument.
      let fact = toIteratorFactory();
      t.same([...fact()], []);
      t.same([...fact()], []);

      // (if-else clause 2) An iterator that nominally also is an iterable.
      fact = toIteratorFactory(NUMBERS[iterator]());
      t.same([...fact()], NUMBERS);
      t.same([...fact()], []);

      // (if-else clause 2) An iterator that is not iterable.
      const iter = NUMBERS[iterator]();
      fact = toIteratorFactory({
        next() {
          return iter.next();
        },
      });
      t.same([...fact()], NUMBERS);
      t.same([...fact()], []);

      // (if-else clause 3) A true iterable.
      fact = toIteratorFactory(NUMBERS);
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      // (if-else clause 4) An iterator factory.
      fact = toIteratorFactory(() => NUMBERS[iterator]());
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      // (if-else clause 4) A generator.
      fact = toIteratorFactory(function* gen() {
        yield 42;
        yield 665;
        yield 13;
      });
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      // (if-else clause 5) Some other arbitrary value.
      fact = toIteratorFactory(665);
      t.same([...fact()], [665]);
      t.same([...fact()], [665]);

      t.end();
    });

    t.end();
  });

  t.end();
});
