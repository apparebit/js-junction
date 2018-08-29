/* (c) Copyright 2018 Robert Grimm */

import 'mark-of-dev';
import assert from 'assert';
import Context from './context.js';

const {
  create,
  defineProperties,
  defineProperty,
  freeze,
  keys: keysOf,
} = Object;

const configurable = true;
const enumerable = true;
const { is } = Object;
const { isSafeInteger } = Number;
const TYPICAL_TYPE = Symbol.for('typical-type');

/* ================================================================================
 * Decorate an executable type with common properties
 * ================================================================================ */

function decorate(type, name, combinator, ...terms) {
  /* istanbul ignore else */
  if (__DEV__) terms = freeze(terms);

  defineProperties(type, {
    [TYPICAL_TYPE]: { configurable, enumerable, value: true },
    name: { configurable, value: name },
    kind: { configurable, value: combinator.name },
    is: { configurable, value: v => type(v, { asPredicate: true }) },
    combinator: { configurable, value: combinator },
    terms: { configurable, value: terms },
    toString: {
      configurable,
      value() {
        return `[typical-${combinator.name}-type ${this.name}]`;
      },
    },
  });

  return type;
}

/* ================================================================================
 * The base combinator for defining basic domain knowledge
 * ================================================================================ */

function base(name, predicate) {
  if (typeof name === 'function') {
    predicate = name;
    ({ name } = predicate);
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `base()'s name must be string`);
    assert(
      typeof predicate === 'function',
      `base()'s predicate must be a function`
    );
  }

  const api = this;

  function Base(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Base, context, api);
    }

    return predicate(value)
      ? context.toValue(value, Base)
      : context.valueIsNotOfType(value, Base);
  }

  return decorate(Base, name, base, predicate);
}

/* ================================================================================
 * Combinators that modify existing types
 * ================================================================================ */

function refinement(name, type, predicate) {
  if (name[TYPICAL_TYPE]) {
    predicate = type;
    type = name;
    name = `${type.name}Refinement`;
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `refinement()'s name must be a string`);
    assert(type[TYPICAL_TYPE], `refinement()'s type must a type`);
    assert(
      typeof predicate === 'function',
      `refinement()'s predicate must be a function`
    );
  }

  const api = this;

  function Refinement(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Refinement, context, api);
    }

    const result = type(value, context);
    if (context.isErrorWrapper(result)) {
      return result;
    } else if (predicate(result)) {
      return context.toValue(result, Refinement);
    } else {
      return context.valueIsNotOfType(result, Refinement);
    }
  }

  return decorate(Refinement, name, refinement, type, predicate);
}

/* -------------------------------------------------------------------------------- */

function option(name, type) {
  if (name[TYPICAL_TYPE]) {
    type = name;
    name = `${type.name}Option`;
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `option()'s name must be a string`);
    assert(type[TYPICAL_TYPE], `option()'s type must be a type`);
  }

  const api = this;

  function Option(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Option, context, api);
    }

    return value == null ? context.toValue(value) : type(value, context);
  }

  return decorate(Option, name, option, type);
}

/* -------------------------------------------------------------------------------- */

function enumeration(name, type, ...constants) {
  if (name[TYPICAL_TYPE]) {
    constants.unshift(type);
    type = name;
    name = `Some${type.name}Enum`;
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `enum()'s name must be a string`);
    assert(type[TYPICAL_TYPE], `enum()'s type must be a type`);
    for (const constant of constants) {
      assert(type.is(constant), `enum()'s constant must have given type`);
    }
  }

  const api = this;

  function Enumeration(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Enumeration, context, api);
    }

    // All constants are guaranteed to have base type. See above.
    for (const constant of constants) {
      if (is(constant, value)) {
        return context.toValue(value, Enumeration);
      }
    }
    return context.valueIsNotOfType(value, Enumeration);
  }

  return decorate(Enumeration, name, enumeration, type, ...constants);
}

defineProperty(enumeration, 'name', { configurable, value: 'enum' });

/* ================================================================================
 * Combinators that produce compound types: array(), tuple(), record().
 * ================================================================================ */

// Iterate over properties for array(), tuple(), and record() types alike.
function forEachTypedProperty(container, keys, types, copy, context) {
  let errors;
  for (const key of keys) {
    const element = container[key];
    const type = types(key);

    context.enter(key, container);
    try {
      const result = type(element, context);
      if (context.isErrorWrapper(result)) {
        if (!context.continueAfterError) {
          return result;
        }
        errors = context.tallyErrors(errors, result);
      } else if (copy !== void 0) {
        copy[key] = result;
      }
    } finally {
      context.exit();
    }
  }

  if (errors !== void 0) {
    return context.wrapErrors(errors);
  } else {
    return context.toValue(copy || container);
  }
}

/* -------------------------------------------------------------------------------- */

const NONE_ELEMENT_OR_ARRAY = 2;
const ELEMENT_OR_ARRAY = 1;
const ARRAY_ONLY = 0;

function array(name, type, { recognizeAsArray } = {}) {
  if (name[TYPICAL_TYPE]) {
    ({ recognizeAsArray } = Object(type));
    type = name;
    name = `${type.name}Array`;
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `array()'s name must be a string`);
    assert(type[TYPICAL_TYPE], `array()'s type must be a type`);
    assert(
      recognizeAsArray == null || typeof recognizeAsArray === 'number',
      `array()'s recognizeAsArray option must be a number`
    );
  }

  const api = this;

  function Array(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Array, context, api);
    }

    if (recognizeAsArray === void 0) {
      recognizeAsArray =
        context.recognizeAsArray !== void 0
          ? context.recognizeAsArray
          : ARRAY_ONLY;
    }
    switch (recognizeAsArray) {
      case NONE_ELEMENT_OR_ARRAY:
        if (value == null) return context.toArray(0);
      // Fall through.
      case ELEMENT_OR_ARRAY: {
        const copy = context.typeIgnoringErrors(value, type);
        if (!context.isErrorWrapper(copy)) return context.toArray(1, copy);
      }
      // Fall through.
      default:
        if (!context.isArray(value)) {
          return context.valueIsNotOfType(value, Array);
        } else {
          return forEachTypedProperty(
            value,
            value.keys(),
            () => type,
            context.validateAndCopy ? [] : void 0,
            context
          );
        }
    }
  }

  return decorate(Array, name, array, type);
}

/* -------------------------------------------------------------------------------- */

function tuple(name, ...types) {
  if (name[TYPICAL_TYPE]) {
    types.unshift(name);
    name = `Some${types.length}Tuple`;
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `tuple()'s name must be a string`);
    for (const type of types) {
      assert(type[TYPICAL_TYPE], `tuple()'s type must be a typical type`);
    }
  }

  const api = this;

  function Tuple(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Tuple, context, api);
    } else if (!context.isArray(value) || value.length !== types.length) {
      return context.valueIsNotOfType(value, Tuple);
    }

    return forEachTypedProperty(
      value,
      value.keys(),
      k => types[k],
      context.validateAndCopy ? [] : void 0,
      context
    );
  }

  return decorate(Tuple, name, tuple, ...types);
}

/* -------------------------------------------------------------------------------- */

function record(name, components, { ignoreExtraProps } = {}) {
  if (name != null && typeof name === 'object') {
    ({ ignoreExtraProps } = Object(components));
    components = name;
    name = `SomeRecord`;
  }

  const componentKeys = keysOf(components);

  /* istanbul ignore else */
  if (__DEV__) {
    assert(typeof name === 'string', `record()'s name must be a string`);
    assert(
      components != null && typeof components === 'object',
      `record()'s components must be an object`
    );
    for (const key of componentKeys) {
      assert(
        components[key][TYPICAL_TYPE],
        `record()'s component value must be a type`
      );
    }
  }

  const api = this;

  function Record(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Record, context, api);
    } else if (value == null || typeof value !== 'object') {
      return context.valueIsNotOfType(value, Record);
    }

    const result = forEachTypedProperty(
      value,
      componentKeys,
      k => components[k],
      context.validateAndCopy ? create(Record.prototype) : void 0,
      context
    );

    if (ignoreExtraProps === void 0) {
      ignoreExtraProps =
        context.ignoreExtraProps !== void 0 ? context.ignoreExtraProps : false;
    }

    if (!ignoreExtraProps) {
      const extras = keysOf(value).filter(k => !components[k]);
      if (extras.length) {
        if (!context.isErrorWrapper(result)) {
          return context.valueHasExtraProperties(value, extras);
        } else {
          return context.mergeWrappers(
            result,
            context.valueHasExtraProperties(value, extras)
          );
        }
      }
    }

    return result;
  }

  return decorate(Record, name, record, { ...components });
}

/* ================================================================================
 * The Typical API
 * ================================================================================ */

const Typical = {
  // Constants.
  NONE_ELEMENT_OR_ARRAY,
  ELEMENT_OR_ARRAY,
  ARRAY_ONLY,

  // Configuration.
  validateAndCopy: void 0,
  continueAfterError: void 0,
  ignoreExtraProps: void 0,
  recognizeAsArray: void 0,

  // Not part of the API, use at your own risk!
  Context,

  // Combinators.
  base,
  refinement,
  option,
  enum: enumeration,
  array,
  tuple,
  record,
};

Typical.Any = Typical.base('Any', () => true);
Typical.Void = Typical.base('Void', v => v == null);
Typical.Boolean = Typical.base('Boolean', v => typeof v === 'boolean');
Typical.Number = Typical.base('Number', v => typeof v === 'number');
Typical.Integer = Typical.refinement('Integer', Typical.Number, isSafeInteger);
Typical.String = Typical.base('String', v => typeof v === 'string');
Typical.Symbol = Typical.base('Symbol', v => typeof v === 'symbol');
Typical.URL = Typical.refinement('URL', Typical.String, v => {
  try {
    // eslint-disable-next-line no-new
    new URL(v, 'apocalypse://demon:lover@hell.com:665');
    return true;
  } catch (_) {
    return false;
  }
});

export default Typical;
