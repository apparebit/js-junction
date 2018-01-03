/* (c) Copyright 2017–2018 Robert Grimm */

// -----------------------------------------------------------------------------
// Semantics

import Tag from '@grr/proact/semantics/tag';
import typeAttribute from '@grr/proact/semantics/attributes';

import {
  isHtmlElement,
  isVoidElement,
} from '@grr/proact/semantics/elements';

import {
  createPrototype,
  createNode,
  ElementTag,
  createElementConstructor,
  PureComponentTag,
  createPureComponentFactory,
} from '@grr/proact/node';

import isDocumentNode from '@grr/proact/node/is-node';
import { define, lookup } from '@grr/proact/node/registry';
import renderAttributes from '@grr/proact/syntax/attributes';

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

  t.test('content', t => {
    const noop = function noop() {};
    const proto = createPrototype(noop, 'nope');
    const node = createNode(proto, 'no',
      { title: 'No Hope!' }, [[1], null, void 0, '', [2, [3]]]);

    t.test('.createPrototype()', t => {
      t.throws(() => createPrototype(665), CODE_INVALID_ARG_TYPE);
      t.throws(() => createPrototype(noop, 665), CODE_INVALID_ARG_TYPE);
      t.throws(() => createPrototype(noop, ''), CODE_INVALID_ARG_TYPE);

      t.throws(() => proto.context(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => proto.script(), CODE_METHOD_NOT_IMPLEMENTED);
      t.throws(() => proto.style(), CODE_METHOD_NOT_IMPLEMENTED);

      t.is(proto.render, noop);
      t.is(proto[toStringTag], 'nope');
      t.end();
    });

    t.test('.createNode()', t => {
      t.is(node.name, 'no');
      t.same(node.attributes, { title: 'No Hope!' });
      t.same(node.children, [1, 2, 3]);
      t.end();
    });

    t.test('.createElementConstructor()', t => {
      const Element = createElementConstructor();

      const miniel = Element('a');
      const el = Element('a', { href: 'location' }, ['somewhere']);

      t.is(miniel[toStringTag], ElementTag);
      t.is(miniel.name, 'a');
      t.same(miniel.attributes, {});
      t.same(miniel.children, []);
      t.is(miniel.render(), miniel);

      t.is(el[toStringTag], ElementTag);
      t.is(el.name, 'a');
      t.same(el.attributes, { href: 'location' });
      t.same(el.children, ['somewhere']);
      t.is(el.render(), el);

      t.end();
    });

    t.test('.createPureComponentFactory()', t => {
      const PureComponentFactory = createPureComponentFactory();
      const NoopComponent = PureComponentFactory(noop);

      const minicomp = NoopComponent('no');
      const comp = NoopComponent('no', { title: 'nada' }, ['niente']);

      function check(value) {
        t.throws(() => value.context(), CODE_METHOD_NOT_IMPLEMENTED);
        t.throws(() => value.script(), CODE_METHOD_NOT_IMPLEMENTED);
        t.throws(() => value.style(), CODE_METHOD_NOT_IMPLEMENTED);

        t.is(value[toStringTag], PureComponentTag);
        t.is(value.name, 'no');
        t.is(value.render(), void 0);
      }

      check(minicomp);
      t.same(minicomp.attributes, {});
      t.same(minicomp.children, []);

      check(comp);
      t.same(comp.attributes, { title: 'nada' });
      t.same(comp.children, ['niente']);

      t.end();
    });

    t.test('.isDocumentNode()', t => {
      t.notOk(isDocumentNode('blah blah blah'));
      t.notOk(isDocumentNode(void 0));
      t.notOk(isDocumentNode(null));

      // Fast check.
      t.ok(isDocumentNode({ [toStringTag]: 'Proact.Element' })); // Oops!

      // Slow check.
      t.notOk(isDocumentNode({ name: 665 }));

      t.notOk(isDocumentNode({
        name: 'no',
        attributes: 13,
      }));

      t.notOk(isDocumentNode({
        name: 'no',
        attributes: { title: 'boo' },
        children: 42,
      }));

      t.notOk(isDocumentNode({
        name: 'no',
        attributes: { title: 'boo' },
        children: [0],
        render: 'whatever',
      }));

      t.ok(isDocumentNode({
        name: 'no',
        attributes: { title: 'boo' },
        children: [0],
        render() { return this; },
      }));

      t.end();
    });

    t.end();
  });

  // ---------------------------------------------------------------------------

  t.test('registry', t => {
    function renderer() {}
    define('renderer', renderer);

    t.throws(() => define('', () => {}), CODE_INVALID_ARG_VALUE);
    t.throws(() => define('meta', () => {}), CODE_INVALID_ARG_VALUE);
    t.throws(() => define('boo', 665), CODE_INVALID_ARG_TYPE);
    t.throws(() => define({ renderer }), CODE_DUPLICATE_BINDING);

    t.is(lookup('renderer'), renderer);
    t.end();
  });

  // ---------------------------------------------------------------------------

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

      t.is(render({ ariaHidden: 'undefined'}), 'aria-hidden=undefined');
      t.is(render({ ariaHidden: true }), 'aria-hidden=true');
      t.is(render({ ariaHidden: false }), 'aria-hidden=false');

      t.is(render({ translate: true }), 'translate=yes');
      t.is(render({ translate: false }), 'translate=no');

      t.is(render({ sizes: [1, 2] }), 'sizes=1,2');

      t.is(render({ title: '"Ahoy!"' }), 'title="&quot;Ahoy!&quot;"');
      t.is(render({ class: ['a', 'b']}), 'class="a b"');

      t.end();
    });

    t.end();
  });

  t.end();
});
