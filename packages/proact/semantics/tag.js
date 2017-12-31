/* (C) Copyright 2017 Robert Grimm */

import { withKeyPath } from '@grr/oddjob/key-path';

const { create } = Object;
const toSymbol = Symbol.for;

const Tag = create(null);

[
  // A comma-separated list or set.
  'HTML.Attribute.CommaSeparated',

  // The many ways of expressing boolean values, optionally including bottom.
  'HTML.Attribute.OnOff',
  'HTML.Attribute.PresentAbsent',       // A "boolean attribute" in HTML5.
  'HTML.Attribute.TrueFalse',
  'HTML.Attribute.TrueFalseMixed',      // A "tristate" value in ARIA.
  'HTML.Attribute.TrueFalseUndefined',  // ARIA.
  'HTML.Attribute.YesNo',

  'HTML.Content.ContainsPhrasing',
  'HTML.Content.Transparent',
  'HTML.Content.Unspecified',
  'HTML.Content.Void',
].forEach(path => {
  withKeyPath(Tag, path, (object, key) => {
    object[key] = toSymbol(path);
  });
});

export default Tag;
