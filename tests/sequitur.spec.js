/* (c) Copyright 2018 Robert Grimm */

import {
  EmptyIterator,
  isGeneratorFunction,
  isIterable,
  isIterator,
  IteratorPrototype,
  toIterable,
  toIterator,
  toIteratorFactory,
  toReplayable,
} from '@grr/sequitur/iterations';

import harness from './harness';

const { create, getOwnPropertyDescriptors, getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;
const NUMBERS = [42, 665, 13];

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

    function createStepFunction() {
      let index = 0;

      return () => {
        if (index < NUMBERS.length) {
          // Please do note that yielded values are objects.
          return { value: { value: NUMBERS[index++] } };
        } else {
          return { done: true };
        }
      };
    }

    t.test('toIterator()', t => {
      const iter = toIterator(createStepFunction());
      t.is(iter.next().value.value, 42);
      t.is(iter.next().value.value, 665);
      t.is(iter.next().value.value, 13);
      t.is(iter.next().value, void 0);
      t.end();
    });

    t.test('toIterable', t => {
      t.same([...toIterable(NUMBERS[iterator]())], NUMBERS);
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

    t.test('toReplayable()', t => {
      const iter = toReplayable(toIterator(createStepFunction()));

      const a1 = [...iter()];
      const a2 = [...iter()];

      t.is(a1.length, 3);
      t.is(a2.length, 3);
      t.is(a1[0], a2[0]);
      t.is(a1[1], a2[1]);
      t.is(a1[2], a2[2]);

      t.end();
    });

    t.test('toIteratorFactory()', t => {
      let fact = toIteratorFactory();
      t.same([...fact()], []);
      t.same([...fact()], []);

      fact = toIteratorFactory(NUMBERS[iterator]());
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      const iter = NUMBERS[iterator]();
      fact = toIteratorFactory({
        next() {
          return iter.next();
        },
      });
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      fact = toIteratorFactory(NUMBERS);
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      fact = toIteratorFactory(() => NUMBERS);
      t.same([...fact()], NUMBERS);
      t.same([...fact()], NUMBERS);

      fact = toIteratorFactory(665);
      t.same([...fact()], [665]);
      t.same([...fact()], [665]);

      t.end();
    });

    t.end();
  });

  t.end();
});
