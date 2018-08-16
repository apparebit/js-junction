# @grr/typical

> Type combinators for data validation and modelling.

This package is as much an adverse reaction to overly complex and strangely
permissive validation libraries — such as [ajv](https://ajv.js.org) and
[joi](https://github.com/hapijs/joi) — as it is sincere flattery for Giulio
Canti's [tcomb](https://github.com/gcanti/tcomb). It is the latter, since
__@grr/typical__ blatantly imitates __tcomb__'s design by also enabling the
expression of complex type constraints by recursively applying combinators on
the result of other combinators. The recursion bottoms out for type constraints
created with the `base()` combinator, which relies on a plain JavaScript
predicate to anchor express __@grr/typical__'s types based on JavaScript values.
Having said that, the similarity between the two packages is only API-deep.
Notably, this package reuses the same traversal code for both validation and
modelling. In contrast, __tcomb__ is for modelling only and the separate
[tcomb-validation](https://github.com/gcanti/tcomb-validation) package takes on
validation duties.

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
  + `typical.Nil` is the opposite type, representing only the `undefined` and
    `null` values, i.e., _bottom_.
  + `typical.Boolean`, `typical.Number`, `typical.String`, and `typical.Symbol`
    are _typical_ types that are equivalent to the namesake primitive types in
    JavaScript (but not the boxed versions).
  + `typical.Integer` is a refinement of `Number` and represents all safe
    integers, as determined by `Number.isSafeInteger()`.
  + `typical.URL` is a refinement of `String` and represents all [WHATWG
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

#### `typical.refine(type, name, predicate)`

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

To help debug code when data validations fail, this package can optionally log
every single predicate test, full data validation, and full validation plus
copy with the [debug](https://www.npmjs.com/package/debug) module. You enable
logging with __debug__ by enabling logging for the `@grr:typical` scope:

```bash
DEBUG=@grr:typical yarn test
```

That will produce many a line looking like this:

```
  @grr:typical FAIL validate value "665" with option type "StringOption" +1ms
  @grr:typical PASS     test value "13" with refinement type "Integer" +4ms
```


## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](https://apparebit.com), released under the [MIT
license](LICENSE).
