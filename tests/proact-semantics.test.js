/* (c) Copyright 2017 Robert Grimm */

import Tag from '@grr/proact-semantics/tag';
import typeAttribute from '@grr/proact-semantics/attributes';

import {
  default as typeElement,
  isHTML,
} from '@grr/proact-semantics/elements';

import harness from './harness';

const { HTML } = Tag;

harness.test('@grr/proact-semantics', t => {
  t.test('.isHTML()', t => {
    t.notOk(isHTML(void 0));
    t.notOk(isHTML(null));
    t.notOk(isHTML(665));
    t.notOk(isHTML('non-existent'));

    t.ok(isHTML('a'));
    t.ok(isHTML('A'));
    t.ok(isHTML('meta'));
    t.ok(isHTML('mEtA'));
    t.end();
  });

  t.test('.typeAttribute()', t => {
    t.is(typeAttribute('aria-disabled'), HTML.Attribute.TrueFalse);
    t.is(typeAttribute('aria-hidden'), HTML.Attribute.TrueFalseUndefined);
    t.is(typeAttribute('aria-pressed'), HTML.Attribute.TrueFalseMixed);
    t.is(typeAttribute('autocomplete'), HTML.Attribute.OnOff);
    t.is(typeAttribute('disabled'), HTML.Attribute.TrueUndefined);
    t.is(typeAttribute('non-existent'), void 0);
    t.is(typeAttribute('sizes'), HTML.Attribute.CommaSeparated);
    t.is(typeAttribute('translate'), HTML.Attribute.YesNo);
    t.end();
  });

  t.test('.typeElement()', t => {
    t.is(typeElement('a'), HTML.Content.Transparent);
    t.is(typeElement('br'), HTML.Content.Void);
    t.is(typeElement('div'), HTML.Content.Unspecified);
    t.is(typeElement('span'), HTML.Content.ContainsPhrasing);
    t.end();
  });

  t.end();
});
