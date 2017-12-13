/* (C) Copyright 2017 Robert Grimm */

/**
 * Determine and normalize the realm. This function normalizes the argument to
 * lower case, replaces `dev` with `development` and `prod` with `production`,
 * and returns the result. Consequently, it passes through names other than
 * those four (after conversion to lower case) and thus supports more
 * fine-grained realms as well. This function is exported to facilitate testing.
 */
export function toRealm(env = process.env.NODE_ENV) {
  env = env && typeof env === 'string' ? env.toLowerCase() : 'development';

  if( env === 'prod' ) {
    return 'production';
  } else if( env === 'dev' ) {
    return 'development';
  } else {
    return env;
  }
}

const realm = toRealm();
export default realm;
