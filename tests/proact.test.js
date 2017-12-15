/* (c) Copyright 2017 Robert Grimm */

import { toSymbolKey } from '@grr/oddjob';

import Tag from '@grr/proact/util/tag';
import typeAttribute from '@grr/proact/model/attributes';
import typeElement from '@grr/proact/model/elements';

import {
  ComponentBase,
  isComponent,
  RenderFunction,
  toComponent,
} from '@grr/proact/component';

import {
  define,
  lookup,
} from '@grr/proact/component/registry';

import harness from './harness';

const { toStringTag } = Symbol;
const { HTML, Proact } = Tag;

const CODE_DUPLICATE_BINDING = { code: 'ERR_DUPLICATE_BINDING' };
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };
const CODE_METHOD_NOT_IMPLEMENTED = { code: 'ERR_METHOD_NOT_IMPLEMENTED' };
const TAG_FUNCTIONAL_COMPONENT = toSymbolKey(Proact.Component.Functional);

// -----------------------------------------------------------------------------

harness.test('@grr/oddjob', t => {
  t.test('model', t => {
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

  // ---------------------------------------------------------------------------

  t.test('component', t => {
    const fn = function fn() {};
    const c1 = new ComponentBase('abstract');
    const c2 = new RenderFunction(fn);
    const c3 = new RenderFunction(fn, 'renderer');

    t.test('ComponentBase', t => {
      t.throws(() => c1.render(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => c1[toStringTag], CODE_METHOD_NOT_IMPLEMENTED);
      t.end();
    });

    t.test('RenderFunction', t => {
      t.is(c2[toStringTag], TAG_FUNCTIONAL_COMPONENT);
      t.is(c3[toStringTag], TAG_FUNCTIONAL_COMPONENT);
      t.is(c2.name, 'fn');
      t.is(c3.name, 'renderer');
      t.end();
    });

    t.test('.isComponent()', t => {
      t.notOk(isComponent());
      t.notOk(isComponent(null));
      t.notOk(isComponent(665));
      t.notOk(isComponent('render'));
      t.notOk(isComponent(fn));

      t.ok(isComponent(c1));
      t.ok(isComponent(c2));
      t.ok(isComponent(c3));
      t.ok(isComponent({ render() {} }));
      t.end();
    });

    t.test('.toComponent()', t => {
      t.is(toComponent(c1), c1);
      t.is(toComponent(c2), c2);
      t.is(toComponent(c3), c3);
      t.is(toComponent(fn).render, fn);

      t.throw(() => toComponent(null), CODE_INVALID_ARG_TYPE);
      t.end();
    });

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('registry', t => {
    function renderer() {}
    define(renderer);

    t.throws(() => define(() => {}), CODE_INVALID_ARG_VALUE);
    t.throws(() => define(function article() {}), CODE_INVALID_ARG_VALUE);
    t.throws(() => define(renderer), CODE_DUPLICATE_BINDING);

    t.is(lookup('renderer').render, renderer);
    t.end();
  });

  t.end();
});
