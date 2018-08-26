# @grr/typical

> Light-weight type combinators for data validation and modelling.

__@grr/typical__ seeks to provide a principled, expressive, and also
light-weight alternative to popular data validation libraries such as
[ajv](https://ajv.js.org) and [joi](https://github.com/hapijs/joi), which are
surprisingly complex thanks to their reliance on JSON Schema (__ajv__) and the
catalog of fine-grained type and value constraints (__joi__). This package tries
to avoid these pitfalls by imitating the design of Giulio Canti's
[tcomb](https://github.com/gcanti/tcomb). First, it models a type or schema to
be a function that takes a value and returns that value (or a copy or a default)
if the argument matches the constraints. Second, it uses combinators to build up
more complex validity constraints from simpler ones. The base cases are
instantiated with the aptly named `base()` combinator, which ensures easy
extensibility by wrapping arbitrary predicates. In other words, __@grr/typical__
has no privileged built-in types.

Beyond that, the two packages differ quite a bit. Critically, __@grr/typical__
seeks to be a self-contained solution for data validation and modelling but no
more. Hence it makes different trade-offs in what warrants inclusion in the
package. Notably, __tcomb__ separates validation into the
[tcomb-validation](https://github.com/gcanti/tcomb-validation) package, leading
to some code duplication because both __tcomb__ and __tcomb-validation__ include
code for traversing validity constraints. Since both concerns are inherently
linked, __@grr/typical__ supports both with the exact same code — modulo four
simple conditionals across ~700 lines of JavaScript in
[Prettier](https://prettier.io) format. At the same time, this package considers
modelling code out of scope and thus does not support __tcomb__'s `func()` and
`interface()` combinators nor the `match()` and `update()` functions. In fact,
it probably will never support them, since they do not seem necessary for
managing data such as configuration state or high-level messages.


## API

Add __@grr/typical__ to your project.

```bash
yarn add @grr/typical
```

Once the package is installed, you can import __@grr/typical__'s API.

```js
import typical from '@grr/typical';
```

When I say API, I really mean a JavaScript object with options, constants, the
type combinators, and predefined types covering the most basic use cases. Please
be sure to always invoke type combinators as methods of such an API object,
never as stand-alone functions. You may create new API objects, e.g., to modify
the configuration, simply by making a shallow copy of an existing API object:

```js
const typ = Object.assign({}, typical, { continueAfterError: true });
const MyString = typ.base('MyString', v => typeof v === 'String');

MyString('hello'); // 👍 'hello'
MyString(665);     // 💥 TypeError: due to 1 type violation:
                   //      #1: value "665" is not of type MyString
                   //      at Context.throwError ...
```

The example above creates a new API object, with the `continueAfterError` option
enabled. It then invokes the `base()` combinator to create our first _typical_
type, which is named `MyString` and conveniently accepts all JavaScript strings.
The code snippet then tries to validate two different values as my strings. The
first one succeeds and returns the appelation. The second one fails and throws
an error with a descriptive message.

Please don't define your own _typical_ types that correspond with JavaScript's
built-in types, as I did for `MyString` above. Since these types are so
fundamental to JavaScript code, __@grr/typical__ defines them and exports them
through the API object. For example, `typical.String` is an executable type that
accepts all JavaScript strings. Its definition pretty much is the same as that
for my strings.


### 1. Configuration

To accommodate better accommodate different use cases, __@grr/typical__ supports
a few configuration options. You configure them either by setting the namesake
property on an API object or by passing an object with those properties to a
_typical_ type as the second argument, right after the value:

```js
MyString('hello', { continueAfterError: false });
```

In this case, we are disabling the `continueAfterError` option again, but that
only lasts for the duration of the call. Since options can be specified when
invoking a type, in some cases when creating a type, and when creating or
modifying an API object, __@grr/typical__ relies on the following two simple
rules to combine options while hardly limiting flexibility:

 1. Given an object that may specify configuration options, ignore all
    properties that are either missing or have `undefined` as value.
 2. Prefer options passed to the executable type over options specified when
    creating said type over options specified when creating or modifying the API
    object.

Supported options are:

  + `continueAfterError` determines whether the recursive traversal of type and
    value continues after encountering an error. The default is to terminate
    the traversal after the first error.
  + `ignoreExtraProps` determines whether records, which are simply JavaScript
    objects, may have additional properties beyond those specified for the
    record type. The default is not to allow extra properties.
  + `validateAndCopy` determines whether to recursively copy the values of
    compound types, i.e., arrays, tuples, and records. The default is to
    validate values only.
  + `recognizeAsArray` determines what values are recognized as valid array
    values. There are three options, described next under Constants.

If both `ignoreExtraProps` and `validateAndCopy` are enabled, then the copy
returned from a _typical_ record type does _not_ include extra properties, even
if they are present in the object passed into the function representing a
record type.


### 2. Useful Constants

Typical's API object includes three constants to be used with the
`recognizeAsArray` option.

  + `ARRAY_ONLY` indicates to only accept an array value as an array type. This
    is the default.
  + `ELEMENT_OR_ARRAY` indicates to also accept a value that matches the array
    type's element type. In that case, the value is automatically coerced to a
    well-formed array by creating a new array with the value as its only element.
  + `NONE_ELEMENT_OR_ARRAY` indicates to also accept `undefined` or `null` as an
    array. In that case, the value is automatically coerced to a well-formed
    array by creating a new empty array.

This description of type checks is _not_ exhaustive. Notably, to match an array
type, every element of a non-empty array value must also match the array type's
element type.


### 3. Built-In Types

Conveniently, this package pre-defines a number of generally useful _typical_
types. Their names are nouns by this package's convention (not imperative verbs)
and, where possible, are the same as those of corresponding TypeScript types,
with the first letter capitalized.

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

### 4. Type-Creating Combinators

__@grr/typical__'s combinators create new _typical_ types, with each type being
a function that validates and possibly copies its arguments. Each such function
returned from a combinator also has the following properties:

  + `[Symbol.for('typical-type')]` is `true`, thus identifying _typical_ types.
  + `name` identifies the type's name.
  + `kind` identifies the name of the combinator that created the type.
  + `combinator` references just that combinator.
  + `terms` references an array with the combinator's arguments modulo
    name.
  + `is()` is the predicate checking whether a value matches the type.


#### `typical.base([name,] predicate)`

Define a new base type, which matches a value if the predicate returns a
non-falsy value. Base types are the only possible leafs in the combinator tree
of a _typical_ type. They are expressed in terms of restrictions on host
language values. In other words, this ensures that every _typical_ type
ultimately is grounded in JavaScript, just like this definition of a number
type:

```js
const MyNumber = typical.base('MyNumber', v => typeof v === 'Number');
assert(MyNumber.is(42)); // 👍
```

#### `typical.refinement([name,] type, predicate)`

Define a new refinement type, which matches a value if the value matches the
base type and futher matches the refinement's predicate. For example, the
following code snippet derives an integer type from the above number type:

```js
const MyInteger = typical.refinement('MyInteger', MyNumber, Number.isSafeInteger);
assert(MyInteger.is(42)); // 👍
```

#### `typical.option([name,] type)`

Define a new option type, which matches a value if the value is `undefined` or
`null`, or if the value matches the base type. Using the `MyString` type from
way above, we can now make the text value optional:

```js
const MyOptionalString = typical.option(MyString);
assert(MyOptionalString.is(null)); // 👍
assert(MyOptionalString.is('hello')); // 👍
```

#### `typical.enum([name,] type, ...constants)`

Define a new enumeration type, which matches a value if, recursively, the value
is the same as one of the constants. For the enumeration to be valid, every
constant must match the base type. The implementation of enumeration types uses
`Object.is()` for equality testing. That works well for enumeration constants
that are JavaScript numbers and strings (`typical.Number` and `typical.String`)
but does not work well for objects and arrays. After all, `Object.is()` only
detects identity for the latter two types. In scenarios where this is in fact
desired, JavaScript symbols (`typical.Symbol`) are the better alternative since
they are explicitly designed for this use case.

When compared to the `===` operator, `Object.is()` not only has cleaner
semantics but also turns `NaN` into a perfectly [valid enumeration
constant](https://github.com/apparebit/js-junction/tests/typical.spec.js#L391).
In case that this does not impress you, I can only emphasize that I never jest
about `NaN`. In fact, I am certain that, if one were to build a trading platform
with IEEE floating point double precision numbers as the primary numeric
datatype, then `NaN` would become a ubiquitous error sentinel. NaN FTW!

```js
const NotANumber = typical.enum('NotANumber', MyNumber, NaN);
assert(NotANumber.is(NaN)); // 👍
```

#### `typical.array([name,] type, { recognizeAsArray } = {})`

Define a new array type, which matches JavaScript array values if, recursively,
all array elements match the array type's element type.

As already detailed above, the `recognizeAsArray` option can take on one of
three values:

  + `typical.ARRAY_ONLY` is the default and results in the behavior just
    described, i.e., array value elements being matched against the array type's
    element type.
  + `typical.ELEMENT_OR_ARRAY` relaxes validation to also treat a single value
    that matches the array type's element type as a singleton array value.
  + `typical.NONE_ELEMENT_OR_ARRAY` relaxes validation even further and also
    accepts `undefined` and `null` for an empty array value.

For example, we can define an array using the last option as follows:

```js
const MyArray = typical.array('MyArray', MyInteger, {
  recognizedAsArray: typical.NONE_ELEMENT_OR_ARRAY
});

assert.deepStrictEqual(MyArray(null), []); // 👍
assert.deepStrictEqual(MyArray(665), [665]); // 👍
assert.deepStrictEqual(MyArray([665]), [665]); // 👍
assert.deepStrictEqual(MyArray([13, 42]), [13, 42]); // 👍
```

#### `typical.tuple([name,] ...types)`

Define a new tuple type, which matches JavaScript arrays if, recursively, the
number and sequence of types matches the number and sequence of elements in the
array.

```js
const Twople = typical.tuple('Pair', MyString, MyInteger);
assert(Twople.is(['lucky', 42])); // 👍
```

#### `typical.record([name,] components, { ignoreExtraProps } = {})`

Define a new record type. A JavaScript object matches the type if, recursively,
each property value matches the corresponding component's _typical_ type. Only
enumerable own properties are considered during this recursion. If no name is
provided, the type is named `'SomeRecord'`.

As already described above, the `ignoreExtraProps` controls whether an object
may have only properties explicitly defined as components or extra, arbitrary
properties, which are ignored. In the latter case, the extra properties are not
copied into the freshly created record object. If `typical.record()` returns
some type function `MyRecord()`, the prototype of newly created records returned
from `MyRecord()` is the same value as `MyRecord.prototype`:

```js
const MyURL = ...; // Ooh, an exercise for the reader! 😎

const Person = typical.record('Person', {
  name: MyString,
  url: typical.option(MyURL),
});

// Passing a true validateAndCopy option to Person() makes sure
// that reachable objects and arrays are recursively recreated.
const dt = { name: 'Robert Grimm', url: 'https://apparebit.com' }
const me = Person(dt, { validateAndCopy: true });

assert(Object.getPrototypeOf(me) === Person.prototype); // 👍
assert(me !== dt); // 👍
assert(me.name === me.name); // 👍
assert(me.url === me.url); // 👍
```


## 5. Introspection

To help debug failing typical operations, this package optionally logs every
single predicate call, full validation, and validating creation with the
[debug](https://www.npmjs.com/package/debug) log package. As usual, you enable
logging by adding the scope corresponding to this package's registry name to the
`DEBUG` environment variable:

```bash
DEBUG=@grr:typical yarn test
```

That should produce some lines looking like the following two:

```
@grr:typical FAIL validate value "665" with option type "StringOption" +1ms
@grr:typical PASS   assert value "13" with refinement type "Integer" +4ms
```

__@grr/typical__ creates one log entry for every call to a _typical_ type.
Recursive calls to _typical_ types made as part of that invocation are not
logged, since their result figures into the overall result anyway. This package
records, in order, the state of the match, the kind of the match, the value, and
the kind and name of the type.

The state of the match is either `PASS` or `FAIL`.

The kind of the match is one of three tokens:

  + `assert` when matching type and value through the _typical_ type's `is()`
    predicate.

    ```js
    Boolean.is(665); // 💥  @grr:typical FAIL assert value "665" ...
    ```

  + `validate` when the `validateAndCopy` option is `false`. In that case, the
    call to the _typical_ type is expect to produce detailed error information
    yet return any valid value. In case of a validation failure, the type throws
    an error, whose `causes` property is an array with either the first error
    encountered or all errors encountered depending on the `continueAfterError`
    option.

    ```js
    const o = { name: 'Robert Grimm', url: 'https://apparebit.com' };
    const p = Person(o); // 👍  @grr:typical PASS validate value "{ ... }"
    assert(o === p); // ℹ️  Person() just passes valid value through.
    ```

  + `create` when the `validateAndCopy` option is `true` and all JavaScript
    objects and arrays are copied into newly allocated containers.

    ```js
    const p = Person(o); // 👍  @grr:typical PASS create value "{ ... }"
    assert(o !== p); // ℹ️  Person() creates a new record with proper prototype.
    assert(Object.getPrototypeOf(p) === Person.prototype);
    ```

To copy properties between objects, this package delegates to `Object.assign()`
for doing the heavy lifting. That implies that only enumerable own-properties
are copied and only their values, not their getters or setters.


## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.


## Copyright and License

© 2018 [Robert Grimm](https://apparebit.com), released under the [MIT
license](LICENSE).
