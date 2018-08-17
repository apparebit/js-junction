# @grr/typical

> Type combinators for data validation and modelling.

This package is as much an adverse reaction to overly complex yet strangely
permissive validation libraries — such as [ajv](https://ajv.js.org) and
[joi](https://github.com/hapijs/joi) — as it is sincere flattery for Giulio
Canti's [tcomb](https://github.com/gcanti/tcomb). __@grr/typical__ blatantly
imitates __tcomb__'s overall design and provides currently six combinators that
build executable type specifications from simpler ones. A seventh combinator
provides the base types, with each delegating to a JavaScript function that
determines whether a value of a given type.

Beyond that, the two packages differ quite a bit. Most importantly,
__@grr/typical__ seeks to be a self-contained solution for data validation and
modelling but no more. Hence it makes different trade-offs in what does and does
not warrant inclusion in the package. For example, __tcomb__ separates
validation into the
[tcomb-validation](https://github.com/gcanti/tcomb-validation) package, leading
to some code duplication because both __tcomb__ and __tcomb-validation__ include
code for traversing types. __@grr/typical__ uses the exact same code for both —
modulo four simple conditionals out of 700 lines of JavaScript in
[Prettier](https://prettier.io) format. At the same time, this package does not
support __tcomb__'s `func()` and `interface()` combinators nor the `match()` and
`update()` functions. In fact, it probably will never support them, since none
seems strictly necessary for validating and instantiating plain data, as is
necessary when processing configuration state or application-level messages.


## API

Add __@grr/typical__ to your project.

```bash
yarn add @grr/typical
```

Once the package is installed, you can import __@grr/typical__'s API.

```js
import typical from '@grr/typical';
```

When I say API, I really mean a JavaScript object with configuration options,
some constants, the type combinators as methods, and predefined _typical_ types
covering the most basic use cases.

You should always invoke type combinators by calling them as methods of an API
object, not as functions. However, you may create new API objects, e.g., to
create _typical_ types with a different configuration, simply by making a
shallow copy of an existing API object.

```js
const typ = Object.assign({}, typical, { continueAfterError: true });
const MyString = typ.base('MyString', v => typeof v === 'String');

MyString('hello'); // 👍 'hello'
MyString(665);     // 💥 TypeError: due to 1 type violation:
                   //      #1: value "665" is not of type MyString
                   //      at Context.throwError ...
```

The example first creates a new API object, with the `continueAfterError` option
enabled. Then it invokes the `base()` combinator to create our first _typical_
type named `MyString`. It conveniently corresponds to JavaScript strings.
Finally, we validate two different values as my strings, with the first one
succeeding and returning the value and the second one failing and throwing an
error.

Conveniently, you don't need to define a string type in your own projects, since
the built-in `typical.String` corresponds to JavaScript strings. Its definition
is pretty much the same as for my string.


### Configuration

To accommodate better accommodate different use cases, __@grr/typical__ supports
a few configuration options. You configure them either by setting the namesake
property on an API object or by passing an object with those properties to a
_typical_ type as the second argument, right after the value:

```js
MyString('hello', { continueAfterError: false });
```

In this case, we are disabling the `continueAfterError` option again, but that
only lasts for the duration of the call. Supported options are:

  + `continueAfterError` determines whether the recursive traversal of type and
    value continues after encountering an error. The default is to terminate
    the traversal after the first error.
  + `ignoreExtraProps` determines whether records, which are simply JavaScript
    objects, may have additional properties beyond those specified for the
    record type. The default is not to allow extra properties.
  + `validateAndCopy` determines whether to recursively copy the values of
    compound types, i.e., lists, tuples, and records. The default is to validate
    values only.
  + `recognizeAsList` determines what values are recognized as valid list
    values. There are three options, described next under Constants.

If both `ignoreExtraProps` and `validateAndCopy` are enabled, then the copy
returned from a _typical_ record type does _not_ include extra properties, even
if they are present in the original object.


### Constants

Typical's API object includes three constants to be used with the
`recognizeAsList` option.

  + `LIST_ONLY` indicates to only accept an array value as a list. This is the
    default.
  + `ELEMENT_OR_LIST` indicates to also accept a value that matches the list's
    element type. In that case, the value is automatically coerced to a
    well-formed list by creating a new array with the value as its only element.
  + `NONE_ELEMENT_OR_LIST` indicates to also accept `undefined` or `null` as a
    list. Iin that case, the value is automatically coerced to a well-formed
    list by creating a new empty array.

This description of typing checks is _not_ exhaustive. Notably, to match a list
type, every element of a non-empty array must also match the list's element
type.


### Built-In Types

Conveniently, this package pre-defines a number of generally useful _typical_
types:

  + `typical.Any` is the type representing the universe of all possible values,
    i.e., _top_.
  + `typical.Void` is the opposite type, representing only the `undefined` and
    `null` values, i.e., _bottom_.
  + `typical.Boolean`, `typical.Number`, `typical.String`, and `typical.Symbol`
    are _typical_ types that are equivalent to the namesake primitive types in
    JavaScript (but not the boxed versions).
  + `typical.Integer` is a refinement of `typical.Number` and represents all
    safe integers, as determined by JavaScript's `Number.isSafeInteger()`.
  + `typical.URL` is a refinement of `typical.String` and represents all [WHATWG
    URL](https://url.spec.whatwg.org) values, whether they are relative or
    absolute.


### Combinators

__@grr/typical__'s combinators create new _typical_ types, with each type being
a function that validates and possibly copies a values. Additionally, every
_typical_ type has an `is()` property that implements a predicate on values
returning `true` for a match and `false` otherwise. The `meta` property includes
several properties that describe how a type was constructed.

  + `type.meta.name` specifies the _typical_ type's name.
  + `type.meta.kind` specifies the lower-case combinator name.
  + `type.meta.base` specifies the lone type argument for refinements, options,
    enumerations, and lists.
  + `type.meta.components` specifies the components for enumerations, tuples,
    and records.

#### `typical.base(name, predicate)`

Define a new base type, which matches a value if the predicate returns a
non-falsy value. Base types are the only possible leafs in the combinator tree
of a _typical_ type. They also are expressed in terms of restrictions on host
language values. In other words, this ensures that every _typical_ type
ultimately is grounded in JavaScript.

#### `typical.refinement(type, name, predicate)`

Define a new refinement type, which matches a value if the value matches the
base type and futher matches the refinement's predicate.

#### `typical.option(type, name = type.name + 'Option')`

Define a new option type, which matches a value if the value is `undefined` or
`null`, or if the value matches the base type.

#### `typical.enum(type, name, ...constants)`

Define a new enumeration type, which matches a value if, recursively, the value
is the same as one of the constants. For the enumeration to be valid, every
constant must match the base type. The implementation of an enumeration type
uses `===` for equality, which strongly suggests using only `typical.Number`,
`typical.String`, and `typical.Symbol` as base types.

#### `typical.list(type, name = type.name + 'List', { recognizeAsList } = {})`

Define a new list type, which matches JavaScript array values if, recursively,
all array elements match the list's element type.

As already detailed above, the `recognizeAsList` option can take on one of three
values:

  + `typical.LIST_ONLY` is the default and results in the behavior just
    described, i.e., array elements being matched against the list's element
    type.
  + `typical.ELEMENT_OR_LIST` relaxes validation to also treat a single value
    that matches the list's element type as a singleton list.
  + `typical.NONE_ELEMENT_OR_LIST` relaxes validation even further and also
    accepts `undefined` and `null` for an empty list.

#### `typical.tuple(name, ...types)`

Define a new tuple type, which matches JavaScript arrays if, recursively, the
number and sequence of types matches the number and sequence of elements in the
array.

#### `typical.record(components)` — also: `record(name, components, { ignoreExtraProps } = {})`

Define a new record type, which matches JavaScript objects if, recursively, each
name-to-type mapping matches the name-to-value mapping with, of course, the
names being equal. The typical record type is named after the first of two or
three arguments if present and otherwise is named `'SomeRecord'`. Valid
properties are the enumerable own-properties of the components object.

As already described above, the `ignoreExtraProps` controls whether an object
may only have the properties described when invoking this combinator or further
arbitrary properties. In the latter case, extra properties are not copied in the
freshly allocated record object.


## Debugging

To help with debug failing data validations, this package optionally logs every
single test, validation, and validation & copy using the lightweight
[debug](https://www.npmjs.com/package/debug) package. You enable logging by
adding this package's scope to the `DEBUG` environment variable:

```bash
DEBUG=@grr:typical yarn test
```

That will produce many a line looking like the following two:

```
@grr:typical FAIL validate value "665" with option type "StringOption" +1ms
@grr:typical PASS     test value "13" with refinement type "Integer" +4ms
```

Each line represents a single invocation of a _typical_ type on a value,
including all recursive invocations. __@grr/typical__ logs whether type and
value were a match, the kind of match, the value, and the kind and name of
the type. The kind of match is one of three:

  + `test` when matching type and value for a basic binary `true`/`false` result
    only;
  + `validate` when producing detailed information about either match or failure
    to match, i.e., by returning the now validated value from the type function
    or throwing an error whose `causes` lists all encountered errors.
  + `recreate` when also copying all objects and arrays into newly allocated
    containers.

To copy properties between objects, this package let `Object.assign()` do the
heavy lifting. However, that also means that only enumerable own-properties can
be copied and only so if they do not include getters or setters.


## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.


## Copyright and License

© 2018 [Robert Grimm](https://apparebit.com), released under the [MIT
license](LICENSE).
