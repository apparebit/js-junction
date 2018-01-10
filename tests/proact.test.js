/* (c) Copyright 2017–2018 Robert Grimm */

// -------------------------------------------------------------------------------------------------

// Content Model
import Tag from '@grr/proact/semantics/tag';
import typeAttribute from '@grr/proact/semantics/attributes';
import { isHtmlElement, isVoidElement } from '@grr/proact/semantics/elements';

// vDOM
import Node from '@grr/proact/content/node';
import Element from '@grr/proact/content/element';
import Component from '@grr/proact/content/component';
import { define, lookup } from '@grr/proact/content/registry';

// Render to HTML
import createContext from '@grr/proact/syntax/context';
import renderAttributes from '@grr/proact/syntax/render-attributes';
import { default as render } from '@grr/proact/syntax/render';

import harness from './harness';

const { getPrototypeOf } = Object;
const { toStringTag } = Symbol;
const { Attribute } = Tag.HTML;

const CODE_DUPLICATE_BINDING = { code: 'ERR_DUPLICATE_BINDING' };
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };
const CODE_METHOD_NOT_IMPLEMENTED = { code: 'ERR_METHOD_NOT_IMPLEMENTED' };

// -------------------------------------------------------------------------------------------------

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

  // -----------------------------------------------------------------------------------------------

  t.test('vdom', t => {
    const somewhere = Element('a', { href: 'location' }, ['somewhere']);
    const renderSomething =
      (_, atts, children) => Element('div', { class: 'something' }, children);
    const Something = Component.from(renderSomething, 'Something');
    const thing = Something(null, {}, 'a thing');

    t.test('Node()', t => {
      t.is(Node.prototype.isProactNode, true);
      t.is(Node.prototype.isProactElement, void 0);
      t.is(Node.prototype.isProactComponent, void 0);

      t.same(Node(null, 'much-ado', {}, void 0, null, '', [], [[true, false]]).children, []);
      t.end();
    });

    t.test('Element()', t => {
      t.is(Element.tag, 'Proact.Element');
      t.is(Element.prototype.constructor, Element);
      t.is(Element.prototype.isProactNode, true);
      t.is(Element.prototype.isProactElement, true);
      t.is(Element.prototype.isProactComponent, void 0);
      t.is(Element.prototype[toStringTag], Element.tag);

      t.is(somewhere.constructor, Element);
      t.is(getPrototypeOf(somewhere), Element.prototype);
      t.ok(somewhere.isProactElement);
      t.is(somewhere[toStringTag], Element.tag);
      t.is(somewhere.name, 'a');
      t.same(somewhere.attributes, { href: 'location' });
      t.same(somewhere.children, ['somewhere']);

      t.end();
    });

    t.test('Component()', t => {
      t.throws(() => Component(), CODE_METHOD_NOT_IMPLEMENTED);
      t.end();
    });

    t.test('.Component.from()', t => {
      t.throws(() => Component.from(() => {}), CODE_INVALID_ARG_VALUE);
      t.is(Component.from(function fn() {}).prototype.name, 'fn');
      t.is(Component.from(function fn() {}, 'TheFunction').prototype.name, 'TheFunction');
      t.is(Component.from(() => {}, 'StillTheFunction').prototype.name, 'StillTheFunction');

      t.is(Component.tag, 'Proact.Component');
      t.is(Something.prototype.constructor, Something);
      t.is(Something.prototype.isProactNode, true);
      t.is(Something.prototype.isProactElement, void 0);
      t.is(Something.prototype.isProactComponent, true);
      t.is(Something.prototype[toStringTag], Component.tag);
      t.throws(() => Component.prototype.render(), CODE_METHOD_NOT_IMPLEMENTED);

      t.is(thing.constructor, Something);
      t.is(getPrototypeOf(getPrototypeOf(thing)), Component.prototype);
      t.is(getPrototypeOf(getPrototypeOf(getPrototypeOf(thing))), Node.prototype);
      t.ok(thing.isProactComponent);
      t.throws(() => thing.metadata(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => thing.script(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => thing.style(), CODE_METHOD_NOT_IMPLEMENTED);
      t.is(thing.name, 'Something');
      t.is(Something('OrOther').name, 'OrOther');
      t.same(thing.attributes, {});
      t.same(thing.children, ['a thing']);

      t.end();
    });

    function renderer() {}

    t.test('.define()', t => {
      define('renderer', renderer);

      t.throws(() => define('', () => {}), CODE_INVALID_ARG_VALUE);
      t.throws(() => define('meta', () => {}), CODE_INVALID_ARG_VALUE);
      t.throws(() => define('boo', 665), CODE_INVALID_ARG_TYPE);
      t.throws(() => define('boo', class {}), CODE_INVALID_ARG_TYPE);
      t.throws(() => define({ renderer }), CODE_DUPLICATE_BINDING);

      t.end();
    });

    t.test('.lookup()', t => {
      t.is(lookup('non-existent-component-class-name'), void 0);
      t.is(lookup('renderer'), renderer);

      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  t.test('syntax', t => {
    t.test('.renderAttributes()', t => {
      const NIL = Symbol('nil');

      const render = attributes => {
        const result = [...renderAttributes(attributes)];

        switch( result.length ) {
          case 0:
            return NIL;
          case 1:
            return result[0];
          default:
            return t.fail(
              `${result.length} attributes where 0 or 1 expected`);
        }
      };

      t.is(render({ hidden: true }), 'hidden');
      t.is(render({ hidden: false }), NIL);

      t.is(render({ ariaDisabled: true }), 'aria-disabled=true');
      t.is(render({ ariaDisabled: false }), 'aria-disabled=false');

      t.is(render({ ariaChecked: 'mixed' }), 'aria-checked=mixed');
      t.is(render({ ariaChecked: true }), 'aria-checked=true');
      t.is(render({ ariaChecked: false }), 'aria-checked=false');

      t.is(render({ ariaHidden: 'undefined' }), 'aria-hidden=undefined');
      t.is(render({ ariaHidden: true }), 'aria-hidden=true');
      t.is(render({ ariaHidden: false }), 'aria-hidden=false');

      t.is(render({ translate: true }), 'translate=yes');
      t.is(render({ translate: false }), 'translate=no');

      t.is(render({ sizes: [1, 2] }), 'sizes=1,2');
      t.is(render({ sizes: [' 1 ', ' 2 '] }), 'sizes=1,2');

      t.is(render({ title: '"Ahoy!"' }), 'title="&quot;Ahoy!&quot;"');
      t.is(render({ title: '   Yo   ' }), 'title=Yo');
      t.is(render({ class: ['a', 'b'] }), 'class="a b"');

      t.end();
    });

    t.test('.render()', t => {
      // >>> Elements with and without attributes.
      const Link = Component.from(function renderLink(name, attributes, children) {
        return Element('a', attributes, children);
      }, 'Link');

      t.is(render(Link('Mine', null, 'landing page')).toString(),
        '<a>landing page</a>');
      t.is(render(Link('Mine', { href: 'apparebit.com', rel: 'home' }, 'landing page')).toString(),
        '<a href=apparebit.com rel=home>landing page</a>');

      // >>> Void elements.
      t.is(render(Element('hr')).toString(), '<hr>');
      t.throws(() => render(Element('hr', {}, 'but, but, but!')), CODE_INVALID_ARG_VALUE);

      // >>> Ignored values. To circumvent the constructor's `flattenNonNullElementsOf()`,
      // the test must use its own fake node.
      t.is(render({
        isProactElement: true,
        name: 'span',
        attributes: {},
        children: [void 0, null, '', true, false, ['W', 0, 0, 't!']],
      }).toString(), '<span>W00t!</span>');

      // >>> Values other than nodes and strings.
      t.is(render(665).toString(), '665');
      t.is(render([6, 6, 5]).toString(), '665');
      t.throws(() => render(Symbol('oops')), CODE_INVALID_ARG_TYPE);

      // >>> Regular vs shallow rendering.
      t.is(render(Element('a', null, Element('b', null, Element('i', null, 'nested')))).toString(),
        '<a><b><i>nested</i></b></a>');
      t.is(render(Element('a', null, Element('b', null, Element('i', null, 'nested'))),
        createContext().forShallowNodes()).toString(), '<a></a>');

      // FIXME: add larger test nesting components and nodes in each other.

      t.end();
    });

    t.end();
  });

  t.end();
});
