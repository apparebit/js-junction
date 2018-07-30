/* (c) Copyright 2018 Robert Grimm */

import {
  EmptyIterator,
  isGeneratorFunction,
  isIterable,
  isIterator,
  IteratorPrototype,
  toIteratorFactory,
} from '@grr/sequitur/iterations';

import Sq from '@grr/sequitur';
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
        })
      );

      t.ok(
        isIterable({
          [iterator]() {
            return this;
          },
          next() {
            return { done: true };
          },
        })
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
          }[iterator]()
        )
      );

      t.ok(
        isIterator({
          [iterator]() {
            return this;
          },
          next() {
            return { done: true };
          },
        })
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
      ['next', toStringTag].forEach(name => {
        t.ok(descriptors[name].configurable);
        ['enumerable', 'writable'].forEach(prop =>
          t.notOk(descriptors[name][prop])
        );
      });

      const { value, done } = EmptyIterator.next();
      t.is(value, void 0);
      t.is(done, true);

      t.end();
    });

    t.test('toIteratorFactory()', t => {
      const materialize = fact => [...{ [iterator]: fact }];

      // (if-else clause 1) No argument.
      let fact = toIteratorFactory();
      t.same(materialize(fact), []);
      t.same(materialize(fact), []);

      // (if-else clause 2) An iterator that nominally also is an iterable.
      fact = toIteratorFactory(NUMBERS[iterator]());
      t.same(materialize(fact), NUMBERS);
      t.same(materialize(fact), []);

      // (if-else clause 2) An iterator that is not iterable.
      const iter = NUMBERS[iterator]();
      fact = toIteratorFactory({
        next() {
          return iter.next();
        },
      });
      t.same(materialize(fact), NUMBERS);
      t.same(materialize(fact), []);

      // (if-else clause 3) A true iterable.
      fact = toIteratorFactory(NUMBERS);
      t.same(materialize(fact), NUMBERS);
      t.same(materialize(fact), NUMBERS);

      // (if-else clause 4) An iterator factory.
      fact = toIteratorFactory(() => NUMBERS[iterator]());
      t.same(materialize(fact), NUMBERS);
      t.same(materialize(fact), NUMBERS);

      // (if-else clause 4) A generator.
      fact = toIteratorFactory(function* gen() {
        yield 42;
        yield 665;
        yield 13;
      });
      t.same(materialize(fact), NUMBERS);
      t.same(materialize(fact), NUMBERS);

      // (if-else clause 5) Some other arbitrary value.
      fact = toIteratorFactory(665);
      t.same(materialize(fact), [665]);
      t.same(materialize(fact), [665]);

      t.end();
    });

    t.end();
  });

  t.test('Sq', t => {
    t.test('.of()', t => {
      t.same([...Sq.of()], []);
      t.same([...Sq.of(42, 665, 13)], NUMBERS);
      t.end();
    });

    t.test('.from()', t => {
      t.same([...Sq.from()], []);
      t.same([...Sq.from(null)], []);
      t.same([...Sq.from(NUMBERS)], NUMBERS);
      t.end();
    });

    t.test('.entries()', t => {
      const o = {};
      const sq = Sq.entries(o);

      // Check that sequence reflects object's properties.
      t.same([...sq], []);

      // Check that sequence includes all keys at time of terminal operation.
      o.mark = 665;
      t.same([...sq], [['mark', 665]]);
      o.beast = 13;
      t.same([...sq], [['mark', 665], ['beast', 13]]);

      // Check that sequence includes values at time of yielding property.
      const iter = sq[iterator]();
      t.same(iter.next(), { value: ['mark', 665], done: false });
      o.beast = 42;
      t.same(iter.next(), { value: ['beast', 42], done: false });

      t.end();
    });

    t.test('#entries()', t => {
      t.same([...Sq.from(NUMBERS).entries()], [[0, 42], [1, 665], [2, 13]]);
      t.end();
    });

    t.test('#filter()', t => {
      t.same([...Sq.from(NUMBERS).filter(el => el <= 42)], [42, 13]);
      t.end();
    });

    t.test('#map()', t => {
      t.same([...Sq.from(NUMBERS).map(el => el + 1)], [43, 666, 14]);
      t.end();
    });

    t.test('#flatMap()', t => {
      t.same([...Sq.from(NUMBERS).flatMap(el => [el])], NUMBERS);
      t.end();
    });

    t.test('#tap()', t => {
      let count = 0;
      t.same([...Sq.from(NUMBERS).tap(_ => count++)], NUMBERS);
      t.is(count, 3);
      t.end();
    });

    t.test('#reduce()', t => {
      t.is(
        Sq.from(NUMBERS).reduce((acc, el) => acc + el, 1),
        1 + 42 + 665 + 13
      );
      t.end();
    });

    t.test('#join()', t => {
      t.is(Sq.from().join(), '');
      t.is(Sq.from(NUMBERS).join(), '4266513');
      t.is(Sq.from(NUMBERS).join(', '), '42, 665, 13');
      t.end();
    });

    t.test('#toArray()', t => {
      t.same(Sq.from(NUMBERS).toArray(), NUMBERS);
      t.same(Sq.from(NUMBERS).toArray([0]), [0, 42, 665, 13]);
      t.end();
    });

    t.end();
  });

  t.end();
});
