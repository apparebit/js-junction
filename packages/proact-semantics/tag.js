/* (C) Copyright 2017 Robert Grimm */

import { withKeyPath } from '@grr/oddjob/key-path';

const { create } = Object;
const toSymbol = Symbol.for;

const Tag = create(null);

[
  'HTML.Attribute.CommaSeparated',
  'HTML.Attribute.Empty',
  'HTML.Attribute.OnOff',
  'HTML.Attribute.TrueUndefined',  // Also known as boolean attribute.
  'HTML.Attribute.TrueFalse',
  'HTML.Attribute.TrueFalseMixed',
  'HTML.Attribute.TrueFalseUndefined',
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
