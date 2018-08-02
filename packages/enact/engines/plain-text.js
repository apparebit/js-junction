/* (c) Copyright 2018 Robert Grimm */

import Sq from '@grr/sequitur';

const { isArray } = Array;

function hasDisplay(value) {
  return value != null && typeof value !== 'boolean';
}

function normalize(values) {
  return Sq.from(values)
    .flatten()
    .filter(hasDisplay);
}

const BETWEEN = />\s+</gu;
const INSIDE = /\s+/gu;

export function html(strings, ...values) {
  let [text] = strings;
  for (const [index, value] of values.entries()) {
    if (isArray(value)) {
      text += normalize(value).join();
    } else if (hasDisplay(value)) {
      text += String(value);
    }
    text += strings[index + 1];
  }

  // Since `<` must be escaped almost anywhere in a HTML document, we
  // use the simplest regex imaginable for detecting the space between
  // two elements. Of course, that means it may just go horribly
  // wrong!
  return (
    text
      .trim()
      // Remove *all* whitespace between elements.
      .replace(BETWEEN, '><')
      // But leave one space everywhere else.
      .replace(INSIDE, ' ')
  );
}

// Igoring flattening and filtering, the plain-text engine's
// hyperscript function `h(fn, ...args)` is not strictly necessary and
// direct invocation `fn(...args)` might produce the same result. But
// that would prevent a seamless switch between render engines, since
// an engine implementing view components needs to intercept their
// instantiation. This can be achieved by wrapping each component
// constructor, _including_ each render function. Or it can be
// achieved by using a generic helper function such as `h()`. Since
// tagged templates abstract over invocations of `h()` but do not
// impact component definition, using a generic helper function seems
// the more user-friendly alternative.
export function h(renderer, ...args) {
  return renderer(...normalize(args));
}
