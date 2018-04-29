/* (C) Copyright 2018 Robert Grimm */

const { keys: keysOf } = Object;

const PREFIXES = {
  facebook: 'https://www.facebook.com/',
  fbAppId: 'https://developers.facebook.com/apps/',
  github: 'https://github.com/',
  linkedin: 'https://www.linkedin.com/in/',
  npm: 'https://www.npmjs.com/~',
  twitter: 'https://twitter.com/',
};

export function toSiteAndAccount(url) {
  if( url.endsWith('/') ) url = url.slice(0, -1);

  for( const site of keysOf(PREFIXES) ) {
    const prefix = PREFIXES[site];

    if( url.startsWith(prefix) ) {
      const account = url.slice(prefix.length);
      if( account ) return { site, account };
    }
  }

  return null;
}

export function toUserUrl(site, account) {
  return `${PREFIXES[site]}${account}`;
}
