/* (c) Copyright 2017 Robert Grimm */

import Tag from '@grr/proact/util/tag';
import typeAttribute from '@grr/proact/model/attributes';
import typeElement from '@grr/proact/model/elements';

import harness from './harness';

harness.test('@grr/oddjob', t => {
  t.test('.typeAttribute()', t => {
    t.is(typeAttribute('aria-disabled'), Tag.HTML.Attribute.TrueFalse);
    t.is(typeAttribute('aria-hidden'), Tag.HTML.Attribute.TrueFalseUndefined);
    t.is(typeAttribute('aria-pressed'), Tag.HTML.Attribute.TrueFalseMixed);
    t.is(typeAttribute('autocomplete'), Tag.HTML.Attribute.OnOff);
    t.is(typeAttribute('disabled'), Tag.HTML.Attribute.TrueUndefined);
    t.is(typeAttribute('non-existent'), void 0);
    t.is(typeAttribute('sizes'), Tag.HTML.Attribute.CommaSeparated);
    t.is(typeAttribute('translate'), Tag.HTML.Attribute.YesNo);
    t.end();
  });

  t.test('.typeElement()', t => {
    t.is(typeElement('a'), Tag.HTML.Content.Transparent);
    t.is(typeElement('br'), Tag.HTML.Content.Void);
    t.is(typeElement('div'), Tag.HTML.Content.Unspecified);
    t.is(typeElement('span'), Tag.HTML.Content.ContainsPhrasing);
    t.end();
  });

  t.end();
});
