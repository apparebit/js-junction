/* (C) Copyright 2017 Robert Grimm */

import { hyphenate } from '@grr/oddjob/strings';
import { maybe } from '@grr/oddjob/functions';
import Tag from '../semantics/tag';
import typeAttribute from '../semantics/attributes';

const { isArray } = Array;
const { keys } = Object;

const {
  CommaSeparated,
  PresentAbsent,
  TrueFalse,
  TrueFalseMixed,
  TrueFalseUndefined,
  YesNo,
} = Tag.HTML.Attribute;

// -----------------------------------------------------------------------------

function formatKeyBoolean(key, value) {
  return value ? `${key}=true` : `${key}=false`;
}

function formatKeyToken(key, value) {
  return `${key}=${value}`;
}

const NEEDS_QUOTING = /[\t\n\f\r "&'=<>`]/;

const ESCAPES = {
  '"': '&quot;',
  '&': '&amp;',
  '\'': '&#x27;',
  '<': '&lt;',
  '>': '&gt;',
  '`': '&#x60;',
};

const ESCAPABLE = new RegExp(`[${keys(ESCAPES).join('')}]`, 'g');

function formatKeyValue(key, value, separator = ' ') {
  if( isArray(value) ) {
    value = value.filter(el => el != null).join(separator);
  } else {
    value = String(value);
  }

  if( value === '' || NEEDS_QUOTING.test(value) ) {
    return `${key}="${value.replace(ESCAPABLE, f => ESCAPES[f])}"`;
  } else {
    // This is safe as long as the characters that require quoting are a strict
    // superset of the characters that require escaping.
    return `${key}=${value}`;
  }
}

// -----------------------------------------------------------------------------

const renderAttribute = maybe((key, value) => {
  key = hyphenate(key);

  switch( typeAttribute(key) ) {
    case PresentAbsent:
      return value ? key : null;
    case TrueFalse:
      return formatKeyBoolean(key, value);
    case TrueFalseMixed:
      if( value === 'mixed' ) return formatKeyToken(key, value);
      return formatKeyBoolean(key, value);
    case TrueFalseUndefined:
      if( value === 'undefined' ) return formatKeyToken(key, value);
      return formatKeyBoolean(key, value);
    case YesNo:
      return formatKeyToken(key, value ? 'yes' : 'no');
    case CommaSeparated:
      return formatKeyValue(key, value, ',');
    default:
      return formatKeyValue(key, value);
  }
});

export default function* renderAttributes(attributes) {
  for( const key of keys(Object(attributes)) ) {
    const attribute = renderAttribute(key, attributes[key]);
    if( attribute ) yield attribute;
  }
}
