/* (c) Copyright 2017–2018 Robert Grimm */

// -------------------------------------------------------------------------------------------------

// Domain Description
import Tags from '@grr/proact/semantics/tags';
import typeAttribute from '@grr/proact/semantics/attributes';
import { isHtmlElement, isVoidElement, hasRawText } from '@grr/proact/semantics/elements';

// vDOM
import Node from '@grr/proact/vdom/node';
import Element from '@grr/proact/vdom/element';
import Component from '@grr/proact/vdom/component';
import { define, lookup } from '@grr/proact/vdom/registry';

// Driver
import { isIgnorable, isIterable, isTextual } from '@grr/proact/driver/kinds';
import TraversalControl from '@grr/proact/driver/traversal-control';
import traverse from '@grr/proact/driver/traverse';
import Driver from '@grr/proact/driver';

// Render to HTML
import renderAttributes from '@grr/proact/html/render-attributes';
import render from '@grr/proact/html/render';

// Test Harness
import harness from './harness';
import { InvalidArgValue } from '@grr/oddjob/errors';

const { getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;
const { Attribute } = Tags.HTML;

const CODE_DUPLICATE_BINDING = { code: 'ERR_DUPLICATE_BINDING' };
const CODE_FUNCTION_NOT_IMPLEMENTED = { code: 'ERR_FUNCTION_NOT_IMPLEMENTED' };
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };
const CODE_MULTIPLE_CALLBACK = { code: 'ERR_MULTIPLE_CALLBACK' };

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

      t.notOk(isVoidElement('non-existent-totally-imaginary-element'));
      t.end();
    });

    t.test('.hasRawText()', t => {
      t.notOk(hasRawText('a'));
      t.notOk(hasRawText('pre'));

      t.ok(hasRawText('script'));
      t.ok(hasRawText('style'));
      t.ok(hasRawText('title'));
      t.ok(hasRawText('textarea'));

      t.notOk(hasRawText('non-existent-totally-imaginary-element'));
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

  const somewhere = Element('a', { href: 'location' }, 'somewhere');
  const renderSomething =
    (_, atts, children) => Element('div', { class: 'something' }, children);
  const Something = Component.from(renderSomething, 'Something');
  const thing = Something({}, 'a thing');

  t.test('vdom', t => {
    t.test('.Node()', t => {
      t.is(Node.isProactNodeFactory, void 0);
      t.throws(() => Node(), CODE_FUNCTION_NOT_IMPLEMENTED);
      t.throws(() => new Node(), CODE_FUNCTION_NOT_IMPLEMENTED);

      t.is(Node.prototype.isProactNode, true);
      t.is(Node.prototype.isProactElement, void 0);
      t.is(Node.prototype.isProactComponent, void 0);

      t.is(Element('span', null,                               'hello!').toString(),
        'Proact.Element(span)');
      t.is(Element('span', { title: 'Greetings', lang: 'en' }, 'hello!').toString(),
        'Proact.Element(span, title=Greetings, lang=en)');
      t.end();
    });

    t.test('.Element()', t => {
      t.is(Element.isProactNodeFactory, true);
      t.is(Element.prototype.constructor, Element);
      t.is(Element.prototype.isProactNode, true);
      t.is(Element.prototype.isProactElement, true);
      t.is(Element.prototype.isProactComponent, void 0);
      t.is(Element.prototype[toStringTag], 'Proact.Element');

      t.is(somewhere.constructor, Element);
      t.is(getPrototypeOf(somewhere), Element.prototype);
      t.ok(somewhere.isProactElement);
      t.is(somewhere[toStringTag], 'Proact.Element');
      t.is(somewhere.name, 'a');
      t.same(somewhere.attributes, { href: 'location' });
      t.same(somewhere.children, ['somewhere']);

      // The children are only normalized lazily, on demand. In other words, not here.
      t.same(Element('much-ado', {}, void 0, null, '', [], [[true, false]]).children,
        [void 0, null, '', [], [[true, false]]]);

      t.end();
    });

    t.test('.Component()', t => {
      t.throws(() => Component(), CODE_FUNCTION_NOT_IMPLEMENTED);
      t.throws(() => new Component(), CODE_FUNCTION_NOT_IMPLEMENTED);
      t.end();
    });

    t.test('.Component.from()', t => {
      t.throws(() => Component.from(() => {}), CODE_INVALID_ARG_VALUE);
      t.is(Component.from(function fn() {}).prototype.name, 'fn');
      t.is(Component.from(function fn() {}, 'TheFunction').prototype.name, 'TheFunction');
      t.is(Component.from(() => {}, 'StillTheFunction').prototype.name, 'StillTheFunction');

      t.is(Something.isProactNodeFactory, true);
      t.is(Something.name, 'Something');
      t.is(Something.prototype.constructor, Something);
      t.is(Something.prototype.isProactNode, true);
      t.is(Something.prototype.isProactElement, void 0);
      t.is(Something.prototype.isProactComponent, true);
      t.is(Something.prototype[toStringTag], 'Proact.Component');

      t.is(thing.constructor, Something);
      t.is(getPrototypeOf(getPrototypeOf(thing)), Node.prototype);
      t.ok(thing.isProactNode);
      t.ok(thing.isProactComponent);
      t.is(thing.name, 'Something');
      t.same(thing.attributes, {});
      t.same(thing.children, ['a thing']);

      const other = Something('OrOther');
      t.is(other.name, 'OrOther');
      t.is(getPrototypeOf(other).name, 'Something');
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

  const renderDriver = new Driver(render);
  const toHTML = (value, options = {}) => [...renderDriver.traverse(value, options)].join('');

  t.test('driver', t => {
    t.test('.isIgnorable()', t => {
      t.ok(isIgnorable(void 0));
      t.ok(isIgnorable(null));
      t.ok(isIgnorable(false));
      t.ok(isIgnorable(true));
      t.ok(isIgnorable(NaN));
      t.ok(isIgnorable(''));

      t.notOk(isIgnorable(0));
      t.notOk(isIgnorable('0'));
      t.notOk(isIgnorable(somewhere));
      t.notOk(isIgnorable(thing));
      t.end();
    });

    t.test('.isTextual()', t => {
      t.notOk(isTextual(void 0));
      t.notOk(isTextual(null));
      t.notOk(isTextual(false));
      t.notOk(isTextual(true));
      t.notOk(isTextual(NaN));
      t.notOk(isTextual(''));

      t.ok(isTextual(0));
      t.ok(isTextual('0'));
      t.end();
    });

    t.test('.isIterable()', t => {
      t.notOk(isIterable(void 0));
      t.notOk(isIterable(null));
      t.notOk(isIterable(false));
      t.notOk(isIterable(true));
      t.notOk(isIterable(665));
      t.notOk(isIterable({}));

      t.ok(isIterable(''));
      t.ok(isIterable([]));
      t.ok(isIterable((function* gen() {})()));
      t.ok(isIterable({ [iterator]() { return { next() { return { done: true }; }}; }}));
      t.end();
    });

    t.test('.TraversalControl()', t => {
      const control = new TraversalControl();
      t.same(control.accept(), { replace: void 0, skip: false });

      control.replaceChildren(somewhere);
      t.throws(() => control.replaceChildren(somewhere), CODE_MULTIPLE_CALLBACK);
      t.throws(() => control.skipChildren(), CODE_MULTIPLE_CALLBACK);
      t.same(control.accept(), { replace: somewhere, skip: false });
      t.same(control.accept(), { replace: void 0,    skip: false });

      control.skipChildren();
      t.throws(() => control.replaceChildren(somewhere), CODE_MULTIPLE_CALLBACK);
      t.throws(() => control.skipChildren(), CODE_MULTIPLE_CALLBACK);
      t.same(control.accept(), { replace: void 0, skip: true });
      t.same(control.accept(), { replace: void 0, skip: false });

      t.end();
    });

    t.test('.traverse()', t => {
      t.match(traverse([void 0, null, '', [], [[true, false]]].reverse()).next(),
        { done: true });
      t.match(traverse(['hello', null, []].reverse()).next(),
        { value: { tag: 'text', object: 'hello' }});
      t.match(traverse(['hello', null, [', there!']].reverse()).next(),
        { value: { tag: 'text', object: 'hello, there!' }});

      function traverseChildren(children, recurse = true) {
        const gen = traverse(children.reverse(), { handler: (_, o) => o, recurse });
        return [...gen];
      }

      t.same(traverseChildren([void 0, null, '', [], [[true, false]]]), []);
      t.same(traverseChildren([1, null, 2, [], [[], 3]]), ['123']);

      t.same([...traverse([somewhere], { recurse: false })], [
        { tag: 'enter', object: somewhere },
        { tag: 'exit',  object: somewhere }
      ]);

      // The weird element's children are 4, 2, and an iterable yielding 65.
      const weirdo = Element('div', null, Element('span', null, 4, 2), {
        [iterator]() {
          return this;
        },
        next() {
          if( !this.flagged ) {
            this.flagged = true;
            return { value: 65 };
          } else {
            return { done: true };
          }
        }
      });

      // The weird effects handler emits textual values for numbers and strings.
      // It also emits HTML-like tags for nodes. Finally, it replaces every
      // <span> with an iterable yielding 6.
      function weirding(tag, object, parent, aside) {
        if( tag === 'text') {
          return String(object);
        } else if( object.name === 'span' ) {
          if( tag === 'enter' ) {
            aside.replaceChildren({
              [iterator]() {
                return this;
              },
              next() {
                if( !this.exhausted ) {
                  this.exhausted = true;
                  return { value: 6 };
                } else {
                  return { done: true };
                }
              },
            });
          }

          return '';
        } else if( tag === 'enter' ) {
          return `<${object.name}>`;
        } else if( tag === 'exit' ) {
          return `</${object.name}>`;
        } else {
          throw InvalidArgValue({ tag }, 'should be "text", "enter", or "exit"');
        }
      }

      // Rendering the weird element with the even weirder effects handler.
      t.is([...traverse([weirdo], { handler: weirding })].join(''), '<div>665</div>');
      t.end();
    });

    t.test('.Driver()', t => {
      t.throws(() => new Driver(665), CODE_INVALID_ARG_TYPE);

      const nullDriver = new Driver();
      t.is(nullDriver.handler, void 0);
      t.is(nullDriver[toStringTag], 'Proact.Driver');

      const br = Element('br');
      const img = Element('img');
      const brimg = Element('div', null, br, img);
      const brimg2 = Element('div', null, [br, img]);

      t.is(toHTML(brimg.children, { ancestors: [brimg], recurse: false }), '<br><img>');
      t.is(toHTML(brimg2.children, { ancestors: [brimg2], recurse: false }), '<br><img>');

      t.is(toHTML(brimg), '<div><br><img></div>');
      t.is(toHTML(brimg2), '<div><br><img></div>');
      t.is(toHTML(somewhere), '<a href=location>somewhere</a>');

      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  t.test('html', t => {
    t.test('.renderAttributes()', t => {
      const NIL = Symbol('nil');

      // Test renderAttributes() with at most one attribute rendered.
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
      // Invoke the effects handler directly to test an invalid tag.
      t.throws(() => render('mad'), CODE_INVALID_ARG_VALUE);

      // >>> Elements with and without attributes.
      const Link = Component.from(function renderLink(name, attributes, children) {
        return Element('a', attributes, children);
      }, 'Link');

      t.is(toHTML(Link(null, 'landing page')),
        '<a>landing page</a>');
      t.is(toHTML(Link('Link', { href: 'apparebit.com', rel: 'home' }, 'landing page')),
        '<a href=apparebit.com rel=home>landing page</a>');

      // >>> Void elements.
      t.is(toHTML(Element('hr')), '<hr>');
      t.throws(() => toHTML(Element('hr', {}, 'but, but, but!')), CODE_INVALID_ARG_VALUE);

      // >>> Ignored values.
      t.is(toHTML(Element('span', {}, void 0, null, '', true, false, ['W', 0, 0, 't!'])),
        '<span>W00t!</span>');

      // >>> Text with consecutive whitespace and escapable characters.
      t.is(toHTML(Element('span', null, '\t\t\n  <BOO>    &\n\nso\non')),
        '<span> &lt;BOO&gt; &amp; so on</span>');

      // >>> Element with raw text as content.
      t.is(toHTML(Element('script', {}, '42 < 665 && 13 > 2')),
        '<script>42 < 665 && 13 > 2</script>');
      t.is(toHTML(Element('script', null, `<!-- ooh -->'<script></script>'`)),
        `<script><\\!-- ooh -->'<\\script><\\/script>'</script>`);
      t.is(toHTML(Element('style', null, '.achtung { color: red; }')),
        '<style>.achtung { color: red; }</style>');

      // >>> Values other than nodes.
      t.is(toHTML(665), '665');
      t.is(toHTML([6, 6, 5]), '665');
      t.throws(() => toHTML(Element('span', null, new TypeError())), CODE_INVALID_ARG_TYPE);
      t.throws(() => toHTML(Element('span', null, Symbol('oops'))), CODE_INVALID_ARG_TYPE);

      // >>> Components that render to lists.
      const Many = Component.from(function renderMany(name, attributes, children) {
        return [...children, ' ', ...children, ' ', ...children];
      }, 'Many');

      t.is(toHTML(Many('Whatever', null, 'w00t!')), 'w00t! w00t! w00t!');

      // >>> Regular vs shallow rendering.
      const abi = Element('a', null, Element('b', null, Element('i', null, 'nested')));
      t.is(toHTML(abi), '<a><b><i>nested</i></b></a>');
      t.is(toHTML(abi, { recurse: false }), '<a></a>');

      // FIXME: add larger test nesting components and nodes in each other.

      t.end();
    });

    t.end();
  });

  t.end();
});
