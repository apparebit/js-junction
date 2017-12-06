/* (c) Copyright 2017 Robert Grimm */

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
