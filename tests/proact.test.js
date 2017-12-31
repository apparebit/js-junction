/* (c) Copyright 2017 Robert Grimm */

import Tag from '@grr/proact/semantics/tag';

import {
  isHtmlElement,
  isVoidElement,
} from '@grr/proact/semantics/elements';

import typeAttribute from '@grr/proact/semantics/attributes';

import {
  COMPONENT_TAG,
  ComponentBase,
  RenderFunction,
  toComponent,
} from '@grr/proact/component';

import isComponent from '@grr/proact/component/is-component';
import { define, lookup } from '@grr/proact/component/registry';

import {
  ELEMENT_TAG,
  ElementBase,
  StandardElement,
  CustomElement,
} from '@grr/proact/element';

import harness from './harness';

const { toStringTag } = Symbol;

const { Attribute } = Tag.HTML;

const CODE_DUPLICATE_BINDING = { code: 'ERR_DUPLICATE_BINDING' };
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };
const CODE_METHOD_NOT_IMPLEMENTED = { code: 'ERR_METHOD_NOT_IMPLEMENTED' };

// -----------------------------------------------------------------------------

harness.test('@grr/proact', t => {
  t.test('semantics', t => {
    t.test('.isHtmlElement()', t => {
      t.notOk(isHtmlElement(void 0));
      t.notOk(isHtmlElement(null));
      t.notOk(isHtmlElement(665));
      t.notOk(isHtmlElement('non-existent'));

      t.ok(isHtmlElement('a'));
      t.ok(isHtmlElement('A'));
      t.ok(isHtmlElement('meta'));
      t.ok(isHtmlElement('mEtA'));
      t.end();
    });

    t.test('.isVoidElement()', t => {
      t.notOk(isVoidElement('a'));
      t.notOk(isVoidElement('div'));

      t.ok(isVoidElement('br'));
      t.ok(isVoidElement('meta'));
      t.end();
    });

    t.test('.typeAttribute()', t => {
      t.is(typeAttribute('aria-disabled'), Attribute.TrueFalse);
      t.is(typeAttribute('aria-hidden'), Attribute.TrueFalseUndefined);
      t.is(typeAttribute('aria-pressed'), Attribute.TrueFalseMixed);
      t.is(typeAttribute('autocomplete'), Attribute.OnOff);
      t.is(typeAttribute('disabled'), Attribute.PresentAbsent);
      t.is(typeAttribute('non-existent'), void 0);
      t.is(typeAttribute('sizes'), Attribute.CommaSeparated);
      t.is(typeAttribute('translate'), Attribute.YesNo);
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
      t.is(c1.name, 'abstract');
      t.throws(() => c1.context, CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => c1.render(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => c1.style(), CODE_METHOD_NOT_IMPLEMENTED);
      t.is(c1[toStringTag], COMPONENT_TAG);
      t.end();
    });

    t.test('RenderFunction', t => {
      t.is(c2[toStringTag], COMPONENT_TAG);
      t.is(c3[toStringTag], COMPONENT_TAG);
      t.is(c2.name, 'fn');
      t.is(c3.name, 'renderer');

      t.throws(() => new RenderFunction('boo'));
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

  // ---------------------------------------------------------------------------

  t.test('element', t => {
    t.test('ElementBase', t => {
      t.is(new ElementBase()[toStringTag], ELEMENT_TAG);
      t.end();
    });

    t.test('StandardElement', t => {
      const span = new StandardElement('span', null, ['text']);

      t.is(span[toStringTag], ELEMENT_TAG);
      t.is(span.name, 'span');
      t.same(span.attributes, {});
      t.same(span.children, ['text']);
      t.is(span.component, void 0);
      t.notOk(span.isCustom());

      const br = new StandardElement('br');

      t.is(br[toStringTag], ELEMENT_TAG);
      t.is(br.name, 'br');
      t.same(br.attributes, {});
      t.same(br.children, []);
      t.is(br.component, void 0);
      t.notOk(br.isCustom());

      t.end();
    });

    t.test('CustomElement', t => {
      const rf = new RenderFunction(function custom() {});
      const custom = new CustomElement(rf, null, 'text');

      t.is(custom[toStringTag], ELEMENT_TAG);
      t.is(custom.name, 'custom');
      t.same(custom.attributes, {});
      t.same(custom.children, ['text']);
      t.is(custom.component, rf);
      t.ok(custom.isCustom());

      t.throws(() => new CustomElement('br'));
      t.end();
    });

    t.end();
  });

  t.end();
});
