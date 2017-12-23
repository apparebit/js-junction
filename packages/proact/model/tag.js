/* (C) Copyright 2017 Robert Grimm */

import { withKeyPath } from '@grr/oddjob';

const { create } = Object;
const toSymbol = Symbol.for;

const tag = create(null);

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

  'Proact.Component.Functional',  // Blueprints
  'Proact.Component.Class',

  'Proact.Element.Builtin',       // Instances
  'Proact.Element.Custom',
].forEach(path => {
  withKeyPath(tag, path, (enclosing, key) => {
    enclosing[key] = toSymbol(path);
  });
});

export default tag;
