/* (c) Copyright 2017–2018 Robert Grimm */

import { EOL } from 'os';

import { quote, asArgId, asValue, asElements } from '@grr/err/format';
import {
  default as punning,
  isPropertyKey,
  toKeyValue,
} from '@grr/err/punning';

import {
  ChildProcessError,
  ChildProcessExited,
  DuplicateBinding,
  FunctionNotImplemented,
  InvalidArgType,
  InvalidArgValue,
  InvalidArrayLength,
  InvalidCallback,
  MalstructuredData,
  MissingArgs,
  MultipleCallback,
  ResourceBusy,
  ResourceNotFound,
  UnsupportedOperation,
} from '@grr/err';

import harness from './harness';

export default harness(__filename, t => {
  t.test('format', t => {
    t.test('quote()', t => {
      t.is(quote(0), '"0"');
      t.is(quote('text'), '"text"');
      t.same(quote([]), []);
      t.same(quote(['hello', 'world']), ['"hello"', '"world"']);
      t.end();
    });

    t.test('asArgId()', t => {
      t.is(asArgId(1), '#1');
      t.is(asArgId('key'), '"key"');
      t.is(asArgId(Symbol('name')), '"Symbol(name)"');
      t.end();
    });

    t.test('asValue()', t => {
      t.is(asValue({ key: 'value' }), `"{ key: 'value' }"`);
      t.is(
        asValue({
          key:
            '01234567890123456789012345678901234567890123456789' +
            '01234567890123456789012345678901234567890123456789',
        }),
        `"{ key:${EOL}   ` +
          `'0123456789012345678901234567890123456789` +
          `012345678901234567890123456789012345678901234 ..."`
      );
      t.end();
    });

    t.test('asElements()', t => {
      t.same(asElements([]), '');
      t.same(asElements([1]), '1');
      t.same(asElements([1, 2]), '1 and 2');
      t.same(asElements([1, 2, 3]), '1, 2, and 3');
      t.end();
    });

    t.end();
  });

  t.test('punning', t => {
    t.test('isPropertyKey()', t => {
      t.notOk(isPropertyKey());
      t.notOk(isPropertyKey(null));

      t.ok(isPropertyKey(42));
      t.ok(isPropertyKey(''));
      t.ok(isPropertyKey('key'));
      t.ok(isPropertyKey(Symbol('ooh special')));
      t.end();
    });

    t.test('toKeyValue()', t => {
      t.same(toKeyValue(['k', 9]), ['k', 9]);
      t.same(toKeyValue([9, 'k']), [9, 'k']);
      t.same(toKeyValue({ k: 9 }), ['k', 9]);
      t.same(toKeyValue({ key: 'k', value: 9 }), ['k', 9]);

      function hello() {}
      t.same(toKeyValue(hello), ['hello', hello]);

      [
        [],
        [null, 2],
        {},
        { a: 1, b: 2, c: 3 },
        { __proto__: { k: 'v' } },
      ].forEach(input => {
        const output = toKeyValue(input);
        t.is(output.length, 2);
        t.is(output[0], void 0);
        t.same(output[1], input);
      });

      t.end();
    });

    t.test('punning()', t => {
      /* eslint-disable key-spacing */
      const fn = (...args) => args;
      const fn0 = punning(fn);
      const fn1 = punning(fn, 1);
      const fn13 = punning(fn, 1, 3);

      t.same(fn0('k', 9), ['k', 9]);
      t.same(fn0({ k: 9 }), ['k', 9]);

      t.same(fn1(10, 'k', 9), [10, 'k', 9]);
      t.same(fn1(10, { k: 9 }), [10, 'k', 9]);

      t.same(fn13(10, 'k', 9, 'l', 8), [10, 'k', 9, 'l', 8]);
      t.same(fn13(10, { k: 9 }, { l: 8 }), [10, 'k', 9, 'l', 8]);

      t.end();
      /* eslint-enable key-spacing */
    });

    t.end();
  });

  t.test('.cause', t => {
    const err = InvalidArgValue('k', 'v');
    t.is(err.cause, null);

    const cause = Error('boo');
    err.causedBy(cause);
    t.is(err.cause, cause);

    t.end();
  });

  t.test('.code', t => {
    [
      [ChildProcessError(10, new Error('x')), 'ERR_CHILD_PROCESS_ERR'],
      [ChildProcessExited(10, 0, null), 'ERR_CHILD_PROCESS_EXITED'],
      [DuplicateBinding('k', 'v', 'w'), 'ERR_DUPLICATE_BINDING'],
      [FunctionNotImplemented('m'), 'ERR_FUNCTION_NOT_IMPLEMENTED'],
      [InvalidArgType('k', 'v', 't'), 'ERR_INVALID_ARG_TYPE'],
      [InvalidArgValue('k', 'v'), 'ERR_INVALID_ARG_VALUE'],
      [InvalidArgValue(5, 'v', 'a number'), 'ERR_INVALID_ARG_VALUE'],
      [InvalidArrayLength('k', 1, 2), 'ERR_INVALID_ARRAY_LENGTH'],
      [InvalidCallback('c'), 'ERR_INVALID_CALLBACK'],
      [MissingArgs('n1', 'n2'), 'ERR_MISSING_ARGS'],
      [MalstructuredData('so bad!'), 'ERR_MALSTRUCTURED_DATA'],
      [MultipleCallback('cb'), 'ERR_MULTIPLE_CALLBACK'],
      [ResourceBusy('r'), 'ERR_RESOURCE_BUSY'],
      [ResourceNotFound('r'), 'ERR_RESOURCE_NOT_FOUND'],
      [UnsupportedOperation('op'), 'ERR_UNSUPPORTED_OPERATION'],
    ].forEach(([err, code]) => {
      t.is(err.code, code);
    });

    t.end();
  });

  t.test('.message', t => {
    const arg = null;
    t.is(
      ChildProcessError(10, new Error('bad message')).message,
      'child process 10 raised error: bad message'
    );
    t.is(
      ChildProcessExited(10, 0, null).message,
      'child process 10 exited normally with code "0"'
    );
    t.is(
      ChildProcessExited(10, 13, null).message,
      'child process 10 exited abnormally with code "13"'
    );
    t.is(
      ChildProcessExited(10, null, 'SIGALRM').message,
      'child process 10 exited abnormally with signal "SIGALRM"'
    );
    t.is(
      FunctionNotImplemented('f').message,
      'function "f" is not implemented'
    );
    t.is(
      FunctionNotImplemented('f', 'factory function').message,
      'factory function "f" is not implemented'
    );
    t.is(
      InvalidArgType({ arg }, 'a number').message,
      'argument "arg" is "null", but should be a number'
    );
    t.is(
      InvalidArgType({ arg }, 'not', 'a number').message,
      'argument "arg" is "null", but should not be a number'
    );
    t.is(InvalidArgValue({ arg }).message, 'argument "arg" is "null"');
    t.is(
      InvalidArgValue({ arg }, 'should be an even number').message,
      'argument "arg" is "null", but should be an even number'
    );
    t.is(
      InvalidArrayLength('a', 1, 3).message,
      'array "a" has 1 element, but should have 3'
    );
    t.is(
      InvalidArrayLength('a', 2, 3).message,
      'array "a" has 2 elements, but should have 3'
    );
    t.is(
      InvalidCallback('callback').message,
      'callback "callback" is not a function'
    );
    t.is(
      MalstructuredData('JSON-LD at path "[42][665]" is not an object').message,
      'JSON-LD at path "[42][665]" is not an object'
    );
    t.is(
      MultipleCallback('cb').message,
      'repeated invocation of callback "cb"'
    );
    t.is(
      MultipleCallback('cb', 'from same handler context').message,
      'repeated invocation of callback "cb" from same handler context'
    );
    t.is(
      ResourceBusy('the Proact driver').message,
      'the Proact driver is busy'
    );
    t.is(
      ResourceNotFound('"package.json" not found').message,
      '"package.json" not found'
    );
    t.is(UnsupportedOperation('op').message, 'operation "op" is not supported');

    t.end();
  });

  t.test('.name', t => {
    [
      [InvalidArgType('k', 'v', 't'), 'TypeError [ERR_INVALID_ARG_TYPE]'],
      [InvalidArgValue('k', 'v'), 'Error [ERR_INVALID_ARG_VALUE]'],
    ].forEach(([err, name]) => {
      t.is(err.name, name);
    });

    t.end();
  });

  t.test('ChildProcessExited', t => {
    let x = ChildProcessExited(10, 13, null);
    t.is(x.pid, 10);
    t.is(x.exitCode, 13);
    t.is(x.signal, null);

    x = ChildProcessExited(11, null, 'SIGALRM');
    t.is(x.pid, 11);
    t.is(x.exitCode, null);
    t.is(x.signal, 'SIGALRM');

    t.end();
  });

  t.end();
});
