/* (C) Copyright 2018 Robert Grimm */

import assert from 'assert';

const { create, keys } = Object;

export function isSchemaOrgContext(url) {
  // Also see Knowledge.toContext(), which normalizes well-known context URLs.
  return url === 'http://schema.org/';
}

const INVERSE_PROPERTIES = {
  albumRelease: 'releaseOf',
  releaseOf: 'albumRelease',
  alumni: 'alumniOf',
  alumniOf: 'alumni',
  containsPlace: 'containedInPlace',
  containedInPlace: 'containsPlace',
  dataset: 'includedInDataCatalog',
  includedInDataCatalog: 'dataset',
  game: 'gameServer',
  gameServer: 'game',
  isPartOf: 'hasPart',
  hasPart: 'isPartOf',
  mainEntity: 'mainEntityOfPage',
  mainEntityOfPage: 'mainEntity',
  makesOffer: 'offeredBy',
  offeredBy: 'makesOffer',
  member: 'memberOf',
  memberOf: 'member',
  parentOrganization: 'subOrganization',
  subOrganization: 'parentOrganization',
  recordedAs: 'recordingOf',
  recordingOf: 'recordedAs',
  recordedIn: 'recordedAt',
  recordedAt: 'recordedIn',
  superEvent: 'subEvent',
  subEvent: 'superEvent',
  workExample: 'exampleOfWork',
  exampleOfWork: 'workExample',
  workTranslation: 'translationOfWork',
  translationOfWork: 'workTranslation',
};

keys(INVERSE_PROPERTIES)
  .forEach(k1 => {
    const k2 = INVERSE_PROPERTIES[k1];
    assert(k2 in INVERSE_PROPERTIES);
  });

export function inverseOf(prop) {
  return INVERSE_PROPERTIES[prop];
}

const WEBPAGE_TYPES = [
  'AboutPage',
  'CheckoutPage',
  'CollectionPage',
  'ContactPage',
  'ImageGallery',
  'ItemPage',
  'ProfilePage',
  'QAPage',
  'SearchResultsPage',
  'VideoGallery',
  'WebPage',
].reduce((map, type) => { map[type] = true; return map; }, create(null));

export function isWebPage(type) {
  return WEBPAGE_TYPES[type];
}

const ACCOUNT_PREFIXES = {
  facebook: 'https://www.facebook.com/',
  fbAppId: 'https://developers.facebook.com/apps/',
  github: 'https://github.com/',
  linkedin: 'https://www.linkedin.com/in/',
  npm: 'https://www.npmjs.com/~',
  twitter: 'https://twitter.com/',
};

export function toNetworkAndAccount(url) {
  for( const site of keys(ACCOUNT_PREFIXES) ) {
    const prefix = ACCOUNT_PREFIXES[site];
    if( url.startsWith(prefix) ) {
      const account = url.slice(0, prefix.length);
      if( account && !account.includes('/') ) {
        return { site, account };
      }
    }
  }

  return null;
}

export function toNetworkLink(site, account) {
  return `${ACCOUNT_PREFIXES[site]}${account}`;
}
