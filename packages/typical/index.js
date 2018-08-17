/* (c) Copyright 2018 Robert Grimm */

import '@grr/mark-of-dev';
import assert from 'assert';
import Context from './context.js';

const {
  assign,
  create,
  defineProperties,
  defineProperty,
  keys: keysOf,
  values,
} = Object;

const configurable = true;
const enumerable = true;
const { isSafeInteger } = Number;
const TYPICAL = Symbol.for('typical-type');

/* ================================================================================
 * Decorator for Annotating Types with Prototype and Metadata
 * ================================================================================ */

function decorate(type, info) {
  // A type's metadata should be non-writable yet enumerable.
  const meta = {};
  defineProperties(meta, {
    name: { configurable, enumerable, value: info.name },
    kind: { configurable, enumerable, value: info.kind },
  });

  if (info.base) {
    defineProperty(meta, 'base', {
      configurable,
      enumerable,
      value: info.base,
    });
  }
  if (info.components) {
    defineProperty(meta, 'components', {
      configurable,
      enumerable,
      value: info.components,
    });
  }
  if (info.predicate) {
    defineProperty(meta, 'predicate', {
      configurable,
      enumerable,
      value: info.predicate,
    });
  }

  const is = function is(v) {
    return type(v, { asPredicate: true });
  };

  const toString = function toString() {
    const label = this.meta.kind[0].toUpperCase() + this.meta.kind.slice(1);
    return `[Typical-${label}-Type ${this.name}]`;
  };

  defineProperties(type, {
    [TYPICAL]: { configurable, enumerable, value: true },
    name: { configurable, value: info.name },
    is: { configurable, value: is },
    meta: { configurable, value: meta },
    toString: { configurable, value: toString },
  });

  return type;
}

/* ================================================================================
 * Combinators that Produce Primitive Types:
 *
 *  +  base(): A type capturing all values matching a predicate.
 *  +  refinement(): Some subset of values of another type.
 *  +  option(): undefined, null, or the values of another type.
 *  +  enum(): Some values, all of another type.
 * ================================================================================ */

function base(name, predicate) {
  const api = this;

  function Base(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Base, context, api);
    }

    return predicate(value)
      ? context.toValue(value, Base)
      : context.valueIsNotOfType(value, Base);
  }

  return decorate(Base, { name, kind: 'base', predicate });
}

/* -------------------------------------------------------------------------------- */

function refinement(type, name, predicate) {
  /* istanbul ignore else */
  if (__DEV__) {
    assert(type[TYPICAL], 'refinement() type argument must be a typical type');
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

  return decorate(Refinement, {
    name,
    kind: 'refinement',
    base: type,
    predicate,
  });
}

/* -------------------------------------------------------------------------------- */

function option(type, name = type.name + 'Option') {
  /* istanbul ignore else */
  if (__DEV__) {
    assert(type[TYPICAL], 'option() type argument must be a typical type');
  }

  const api = this;

  function Option(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Option, context, api);
    }

    return value == null ? context.toValue(value) : type(value, context);
  }

  return decorate(Option, { name, kind: 'option', base: type });
}

/* -------------------------------------------------------------------------------- */

function enumeration(type, name, ...constants) {
  /* istanbul ignore else */
  if (__DEV__) {
    assert(type[TYPICAL], 'enum() type argument must be a typical type');
    for (const constant of constants) {
      assert(
        type.is(constant),
        `enum() constant arguments must have same type as type argument`
      );
    }
  }

  const api = this;

  function Enumeration(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Enumeration, context, api);
    }

    // All constants are guaranteed to have base type. See above.
    for (const constant of constants) {
      if (constant === value) {
        return context.toValue(value, Enumeration);
      }
    }
    return context.valueIsNotOfType(value, Enumeration);
  }

  return decorate(Enumeration, {
    name,
    kind: 'enum',
    base: type,
    components: constants,
  });
}

defineProperty(enumeration, 'name', { configurable, value: 'enum' });

/* ================================================================================
 * Combinators that Produce Compound Types:
 *
 *  +  list(): A variable-length array with all elements having the same type.
 *  +  tuple(): A fixed-length array with each element having a distinct type.
 *  +  record(): An object with each property having a distinct type.
 * ================================================================================ */

// Iterate over properties for list(), tuple(), and record() types alike.
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

const NONE_ELEMENT_OR_LIST = 2;
const ELEMENT_OR_LIST = 1;
const LIST_ONLY = 0;

function list(type, name = type.name + 'List', { recognizeAsList } = {}) {
  /* istanbul ignore else */
  if (__DEV__) {
    assert(type[TYPICAL], 'list() type argument must be a typical type');
  }

  if (name != null && typeof name === 'object') {
    /* istanbul ignore else */
    if (__DEV__) {
      assert(
        typeof name.recognizeAsList === 'number' && arguments.length === 2,
        'list() arguments may omit name and/or options, but options must include "recognizeAsList"'
      );
    }

    ({ recognizeAsList } = name);
    name = type.name + 'List';
  }

  const api = this;

  function List(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, List, context, api);
    }

    if (recognizeAsList === void 0) {
      recognizeAsList =
        context.recognizeAsList !== void 0
          ? context.recognizeAsList
          : LIST_ONLY;
    }
    switch (recognizeAsList) {
      case NONE_ELEMENT_OR_LIST:
        if (value == null) return context.toList(0);
      // Fall through.
      case ELEMENT_OR_LIST: {
        const copy = context.typeIgnoringErrors(value, type);
        if (!context.isErrorWrapper(copy)) return context.toList(1, copy);
      }
      // Fall through.
      default:
        if (!context.isList(value)) {
          return context.valueIsNotOfType(value, List);
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

  return decorate(List, { name, kind: 'list', base: type });
}

/* -------------------------------------------------------------------------------- */

function tuple(name, ...types) {
  /* istanbul ignore else */
  if (__DEV__) {
    for (const type of types) {
      assert(type[TYPICAL], 'tuple() type argument must be a typical type');
    }
  }

  const api = this;

  function Tuple(value, context) {
    if (Context.isRequired(context)) {
      return Context.with(value, Tuple, context, api);
    } else if (!context.isList(value) || value.length !== types.length) {
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

  return decorate(Tuple, { name, kind: 'tuple', components: types });
}

/* -------------------------------------------------------------------------------- */

function record(name, components, { ignoreExtraProps } = {}) {
  if (name != null && typeof name === 'object') {
    /* istanbul ignore else */
    if (__DEV__) {
      assert(
        arguments.length === 1,
        `record() arguments must be component spec only or name, component spec, and maybe options`
      );
    }

    // Always fix arguments.
    components = name;
    name = 'SomeRecord';
  }

  /* istanbul ignore else */
  if (__DEV__) {
    assert(
      components != null && typeof components === 'object',
      `record() component spec must be an object`
    );
    for (const type of values(components)) {
      assert(
        type[TYPICAL],
        `record() component spec argument may only have typical types as values`
      );
    }
  }

  const api = this;
  const componentKeys = keysOf(components);

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

  return decorate(Record, {
    name,
    kind: 'record',
    components: assign({}, components),
  });
}

/* ================================================================================
 * The Typical API
 * ================================================================================ */

const Typical = {
  // Constants.
  NONE_ELEMENT_OR_LIST,
  ELEMENT_OR_LIST,
  LIST_ONLY,

  // Configuration.
  validateAndCopy: void 0,
  continueAfterError: void 0,
  ignoreExtraProps: void 0,
  recognizeAsList: void 0,

  // Combinators.
  base,
  refinement,
  option,
  enum: enumeration,
  list,
  tuple,
  record,
};

Typical.Any = Typical.base('Any', () => true);
Typical.Void = Typical.base('Void', v => v == null);
Typical.Boolean = Typical.base('Boolean', v => typeof v === 'boolean');
Typical.Number = Typical.base('Number', v => typeof v === 'number');
Typical.Integer = Typical.refinement(Typical.Number, 'Integer', isSafeInteger);
Typical.String = Typical.base('String', v => typeof v === 'string');
Typical.Symbol = Typical.base('Symbol', v => typeof v === 'symbol');
Typical.URL = Typical.refinement(Typical.String, 'URL', v => {
  try {
    // eslint-disable-next-line no-new
    new URL(v, 'apocalypse://demon:lover@hell.com:665');
    return true;
  } catch (_) {
    return false;
  }
});

export default Typical;
