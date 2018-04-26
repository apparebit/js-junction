/* (C) Copyright 2018 Robert Grimm */

export function isSchemaOrgContext(context) {
  // A context reference for Schema.org may omit the trailing slash.
  if( context === 'http://schema.org' || context === 'http://schema.org/' ) return true;
  if( context == null || typeof context !== 'object' ) return false;
  // However, the vocabulary must not omit the trailing slash.
  return '@vocab' in context && context['@vocab'] === 'http://schema.org/';
}
