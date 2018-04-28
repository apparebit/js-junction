/* (C) Copyright 2018 Robert Grimm */

import assert from 'assert';

const { keys: keysOf } = Object;

export function isSchemaOrgContext(context) {
  // A context reference for Schema.org may omit the trailing slash.
  if( context === 'http://schema.org' || context === 'http://schema.org/' ) return true;
  if( context == null || typeof context !== 'object' ) return false;
  // However, the vocabulary must not omit the trailing slash.
  return '@vocab' in context && context['@vocab'] === 'http://schema.org/';
}

const INVERSES = {
  albumRelease: 'releaseOf',
  alumni: 'alumniOf',
  alumniOf: 'alumni',
  containsPlace: 'containedInPlace',
  containedInPlace: 'containsPlace',
  dataset: 'includedInDataCatalog',
  exampleOfWork: 'workExample',
  game: 'gameServer',
  gameServer: 'game',
  hasPart: 'isPartOf',
  includedInDataCatalog: 'dataset',
  isPartOf: 'hasPart',
  mainEntity: 'mainEntityOfPage',
  mainEntityOfPage: 'mainEntity',
  makesOffer: 'offeredBy',
  member: 'memberOf',
  memberOf: 'member',
  offeredBy: 'makesOffer',
  parentOrganization: 'subOrganization',
  recordedAs: 'recordingOf',
  recordedAt: 'recordedIn',
  recordedIn: 'recordedAt',
  recordingOf: 'recordedAs',
  releaseOf: 'albumRelease',
  subEvent: 'superEvent',
  subOrganization: 'parentOrganization',
  superEvent: 'subEvent',
  translationOfWork: 'workTranslation',
  workExample: 'exampleOfWork',
  workTranslation: 'translationOfWork',
};

keysOf(INVERSES).forEach(key => assert(key === INVERSES[INVERSES[key]]));

export function inverseOf(key) {
  return INVERSES[key];
}
