/* (c) Copyright 2017–2018 Robert Grimm */

const { isArray } = Array;
const { keys } = Object;
const { stringify } =  JSON;

const WHITESPACE = /[\t\n\f\r ]+/g;
export function normalizeWhitespace(text) {
  return String(text).replace(WHITESPACE, ' ');
}

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

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};
const HTML_ESCAPABLE = new RegExp(`[${keys(HTML_ESCAPES).join('')}]`, 'g');
export function escapeHTML(text) {
  return String(text).replace(HTML_ESCAPABLE, c => HTML_ESCAPES[c]);
}

const ATTRIBUTE_IS_QUOTED = /[\t\n\f\r "&'=<>`]/;
/**
 * Determine whether the HTML attribute value requires double quotes. In that
 * case, the value *must* be escaped with `escapeAttribute()`. This is correct
 * only because this function matches a superset of the characters that require
 * escaping.
 */
export function isAttributeQuoted(value) {
  return value === '' || ATTRIBUTE_IS_QUOTED.test(value);
}

const ATTRIBUTE_ESCAPES = {
  '"': '&quot;',
  '&': '&amp;',
  '\'': '&#x27;',
  '<': '&lt;',
  '>': '&gt;',
  '`': '&#x60;',
};
const ATTRIBUTE_ESCAPABLE = new RegExp(`[${keys(ATTRIBUTE_ESCAPES).join('')}]`, 'g');
export function escapeAttribute(text) {
  return String(text).replace(ATTRIBUTE_ESCAPABLE, c => ATTRIBUTE_ESCAPES[c]);
}

const SCRIPT_ESCAPES = {
  '<!--': '<\\!--',
  '<script': '<\\script',
  '</script': '<\\/script',
};
const SCRIPT_ESCAPABLE = new RegExp(keys(SCRIPT_ESCAPES).join('|'), 'g');
export function escapeScript(text) {
  return String(text).replace(SCRIPT_ESCAPABLE, s => SCRIPT_ESCAPES[s]);
}

export function toStableJSON(value) {
  if( value && typeof value.toJSON === 'function' ) {
    value = value.toJSON();
  }

  if( value == null || typeof value !== 'object' ) {
    // Defer to standard-issue JSON.stringify()
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

export function toSymbolKey(symbol) {
  return String(symbol).slice(7, -1);
}
