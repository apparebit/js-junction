/* (c) Copyright 2017 Robert Grimm */

import Tag from '@grr/proact-semantics/tag';

import {
  isHtmlTag,
  isVoidTag,
  typeAttribute,
} from '@grr/proact-semantics';

import harness from './harness';

const { HTML } = Tag;

harness.test('@grr/proact-semantics', t => {
  t.test('.isHtmlTag()', t => {
    t.notOk(isHtmlTag(void 0));
    t.notOk(isHtmlTag(null));
    t.notOk(isHtmlTag(665));
    t.notOk(isHtmlTag('non-existent'));

    t.ok(isHtmlTag('a'));
    t.ok(isHtmlTag('A'));
    t.ok(isHtmlTag('meta'));
    t.ok(isHtmlTag('mEtA'));
    t.end();
  });

  t.test('.isVoidTag()', t => {
    t.notOk(isVoidTag('a'));
    t.notOk(isVoidTag('div'));

    t.ok(isVoidTag('br'));
    t.ok(isVoidTag('meta'));
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

  t.end();
});
