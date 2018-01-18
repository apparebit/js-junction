/* (c) Copyright 2017–2018 Robert Grimm */

const { isArray } = Array;
const { keys } = Object;
const { stringify } =  JSON;

// -------------------------------------------------------------------------------------------------

const DEHYPHENATABLE = /(-[a-z])/g;

export function dehyphenate(name) {
  return String(name)
    .replace(DEHYPHENATABLE, fragment =>
      fragment
        .charAt(1)
        .toUpperCase());
}

const HYPHENATABLE = /([A-Z])/g;

export function hyphenate(name) {
  return String(name)
    .replace(HYPHENATABLE, '-$1')
    .toLowerCase();
}

// -------------------------------------------------------------------------------------------------

export function toStableJSON(value) {
  if( value && typeof value.toJSON === 'function' ) {
    value = value.toJSON();
  }

  if( value == null || typeof value !== 'object' ) {
    return stringify(value);

  } else if( isArray(value) ) {
    return `[${
      value.map(el => toStableJSON(el) || 'null').join(',')
    }]`;

  } else {
    const properties = [];

    for( const key of keys(value).sort() ) {
      const v = toStableJSON(value[key]);
      if( v ) properties.push(`${toStableJSON(key)}:${v}`);
    }

    return `{${
      properties.join(',')
    }}`;
  }
}

// -------------------------------------------------------------------------------------------------

export function toSymbolKey(symbol) {
  return String(symbol).slice(7, -1);
}
