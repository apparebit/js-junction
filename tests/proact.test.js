/* (c) Copyright 2017–2018 Robert Grimm */

// Domain Description
import Tags from '@grr/proact/spec/tags';
import typeAttribute from '@grr/proact/spec/attributes';
import { isHtmlElement, isVoidElement, hasRawText } from '@grr/proact/spec/elements';

// vDOM
import Node from '@grr/proact/vdom/node';
import Element from '@grr/proact/vdom/element';
import Component from '@grr/proact/vdom/component';
import { define, lookup } from '@grr/proact/vdom/registry';

// Driver
import { isIgnorable, isTextual, next, normalize, pushAll } from '@grr/proact/driver/children';
import Driver from '@grr/proact/driver';

// Render to HTML
import renderAttributes from '@grr/proact/html/render-attributes';
import renderToHtml from '@grr/proact/html/render';

// Proact
import { H, h, renderToString, renderToStream } from '@grr/proact';

// Test Harness
import harness from './harness';
import util from 'util';

const { Attribute } = Tags.HTML;
const { create, getPrototypeOf } = Object;
const { toStringTag } = Symbol;

const CODE_DUPLICATE_BINDING = { code: 'ERR_DUPLICATE_BINDING' };
const CODE_FUNCTION_NOT_IMPLEMENTED = { code: 'ERR_FUNCTION_NOT_IMPLEMENTED' };
const CODE_INVALID_ARG_TYPE = { code: 'ERR_INVALID_ARG_TYPE' };
const CODE_INVALID_ARG_VALUE = { code: 'ERR_INVALID_ARG_VALUE' };
const CODE_MISSING_ARGS = { code: 'ERR_MISSING_ARGS' };
const CODE_RESOURCE_BUSY = { code: 'ERR_RESOURCE_BUSY' };

// -------------------------------------------------------------------------------------------------

harness.test('@grr/proact', t => {
  t.test('spec', t => {
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

  const a = Element('a', { href: 'location' }, 'somewhere');

  function checkElementInstance(t, e) {
    t.is(e.constructor, Element);
    t.is(getPrototypeOf(e), Element.prototype);
    t.ok(e.isViewElement);
    t.is(e[toStringTag], 'Proact.Element');
    t.is(e.name, 'a');
    t.same(e.properties, { href: 'location' });
    t.same(e.children, ['somewhere']);
  }

  const renderContainer = function(props, children) {
    return Element('div', { class: 'custom-container' }, children);
  };
  const Container = Component.from(renderContainer, 'Container');
  const container = Container({}, 'some text');

  function checkContainerInstance(t, c) {
    t.is(c.constructor, Container);
    t.ok(c.isViewComponent);
    t.is(c.name, 'Container');
    t.same(c.properties, {});
    t.same(c.children, ['some text']);
  }

  t.test('vdom', t => {
    t.test('.isPropsObject()', t => {
      t.notOk(Node.isPropsObject());
      t.notOk(Node.isPropsObject(null));
      t.notOk(Node.isPropsObject(Element));
      t.notOk(Node.isPropsObject(a));
      t.notOk(Node.isPropsObject(container));

      t.ok(Node.isPropsObject({}));
      t.ok(Node.isPropsObject(create(null)));
      t.ok(Node.isPropsObject(Object()));
      t.end();
    });

    t.test('.Node()', t => {
      t.is(Node.prototype.isViewElement, void 0);
      t.is(Node.prototype.isViewComponent, void 0);

      t.is(Element('span', 'hello!').toString(), '[object Proact.Element]');

      const format = el => util.inspect(el, { breakLength: Infinity });
      t.is(format(Element('span')),
        `Element { name: 'span', properties: {}, children: [] }`);
      // The null as 2nd argument is important, since it should *not* be treated as a child.
      t.is(format(Element('span', null, 'hello!')),
        `Element { name: 'span', properties: {}, children: [ 'hello!' ] }`);
      t.is(format(Element('span', null, Symbol('ooh special'))),
        `Element { name: 'span', properties: {}, children: [ Symbol(ooh special) ] }`);
      t.is(format(Element('span', { class: ['x', 42] })),
        `Element { name: 'span', properties: { class: [ 'x', 42 ] }, children: [] }`);
      t.is(format(Element('span', { class: 'greeting', lang: 'en', tabindex: -1 }, 'yo', 42)),
        `Element { name: 'span', properties: { class: 'greeting', lang: 'en', tabindex: -1 },`
        + ` children: [ 'yo42' ] }`);
      t.end();
    });

    t.test('.Element()', t => {
      t.is(Element.prototype.constructor, Element);
      t.is(Element.prototype.isViewElement, true);
      t.is(Element.prototype.isViewComponent, void 0);
      t.is(Element.prototype.toString, Object.prototype.toString);
      t.is(Element.prototype[toStringTag], 'Proact.Element');

      t.throws(() => Element(), CODE_MISSING_ARGS);
      t.throws(() => Element(665), CODE_INVALID_ARG_TYPE);
      t.throws(() => Element('a', { context: 665 }), CODE_INVALID_ARG_VALUE);
      t.throws(() => Element('a', { children: 665 }), CODE_INVALID_ARG_VALUE);

      checkElementInstance(t, a);

      // A node's children are normalized in the constructor (again), since that
      // simplifies code that inspects only one or two vDOM nodes. All other
      // traversals should utilize a driver, which does normalization during
      // traversal.
      t.same(Element('much-ado', {}, void 0, null, '', [], [[true, false]]).children, []);
      t.end();
    });

    t.test('.Component()', t => {
      t.throws(() => Component(), CODE_FUNCTION_NOT_IMPLEMENTED);
      t.throws(() => new Component(), CODE_FUNCTION_NOT_IMPLEMENTED);
      t.end();
    });

    t.test('.Component.from()', t => {
      t.throws(() => Component.from(665), CODE_INVALID_ARG_TYPE);
      t.throws(() => Component.from(() => {}), CODE_INVALID_ARG_VALUE);
      t.is(Component.from(function fn() {}).prototype.name, 'fn');
      t.is(Component.from(function fn() {}, 'SomeComponent').prototype.name, 'SomeComponent');
      t.is(Component.from(function fn() {}, 665).prototype.name, '665');
      t.is(Component.from(() => {}, 'AnotherComponent').prototype.name, 'AnotherComponent');
      t.is(Component.from('YetAnotherComponent', () => {}).prototype.name, 'YetAnotherComponent');
      t.is(Component.from(665, () => {}).prototype.name, '665');

      t.throws(() => H(665), CODE_INVALID_ARG_TYPE);
      t.throws(() => H(() => {}), CODE_INVALID_ARG_VALUE);
      t.is(H(function fn() {}).prototype.name, 'fn');
      t.is(H(function fn() {}, 'SomeComponent').prototype.name, 'SomeComponent');
      t.is(H(function fn() {}, 665).prototype.name, '665');
      t.is(H(() => {}, 'AnotherComponent').prototype.name, 'AnotherComponent');
      t.is(H('YetAnotherComponent', () => {}).prototype.name, 'YetAnotherComponent');
      t.is(H(665, () => {}).prototype.name, '665');

      t.is(Container.name, 'Container');
      t.is(Container.prototype.constructor, Container);
      t.is(Container.prototype.isViewElement, void 0);
      t.is(Container.prototype.isViewComponent, true);
      t.is(Container.prototype.toString, Object.prototype.toString);
      t.is(Container.prototype[toStringTag], 'Proact.Component');

      checkContainerInstance(t, container);
      checkContainerInstance(t, Container('some text'));

      t.throws(() => Container({ context: true }), CODE_INVALID_ARG_VALUE);
      t.throws(() => Container({ children: true }), CODE_INVALID_ARG_VALUE);
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

  t.test('hyperscript', t => {
    t.test('h()', t => {
      checkElementInstance(t, h('a', { href: 'location' }, 'somewhere'));
      checkContainerInstance(t, h(Container, 'some text'));
      checkContainerInstance(t, h(Container, {}, 'some text'));

      t.throws(() => h(665), CODE_INVALID_ARG_VALUE);
      t.end();
    });

    t.test('h[]', t => {
      // Make sure `h.a` returns the same element factory every time.
      const { a } = h;

      checkElementInstance(t, a({ href: 'location'}, 'somewhere'));
      t.is(h.a, a);
      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  t.test('children', t => {
    t.test('.isIgnorable()', t => {
      t.ok(isIgnorable(void 0));
      t.ok(isIgnorable(null));
      t.ok(isIgnorable(false));
      t.ok(isIgnorable(true));
      t.ok(isIgnorable(NaN));
      t.ok(isIgnorable(''));

      t.notOk(isIgnorable(0));
      t.notOk(isIgnorable('0'));
      t.notOk(isIgnorable(a));
      t.notOk(isIgnorable(container));
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

    t.test('.pushAll()', t => {
      t.same(pushAll([], [1, 2, 3]), [3, 2, 1]);
      t.same(pushAll([], '123'), ['3', '2', '1']);
      t.end();
    });

    t.test('.next()', t => {
      // The order of children has been reversed for the todo stack.
      // Nested iterables, however, are in the original order.
      t.is(next([[null, '3', null, 4], 2, null, '1']), '1234');
      t.end();
    });

    t.test('.normalize()', t => {
      t.same(normalize([]), []);
      t.same(normalize([void 0, null, true, false, '', [], 6, 6, 5]), ['665']);
      t.end();
    });

    t.end();
  });

  t.test('Driver()', t => {
    t.test('.context', t => {
      const ContextConsumer = Component.from(function ContextConsumer(_, __, context) {
        t.same(context, { answer: 42 });
        return Element('span');
      });

      const ContextProvider = Component.from(function ContextProvider(_, __, context) {
        t.same(context, {});
        this.provideContext({ answer: 42 });
        return Element('div', null, ContextConsumer());
      });

      t.is(renderToString(new ContextProvider()), '<div><span></span></div>');
      t.end();
    });

    t.test('.handle()', t => {
      t.throws(() => new Driver(42), CODE_INVALID_ARG_TYPE);

      // Test driver defaults.
      const nullDriver = new Driver();
      let iter = nullDriver.traverse(a);

      t.same(iter.next(), { done: false, value: { tag: 'enter', object: a }});
      t.same(iter.next(), { done: false, value: { tag: 'text',  object: 'somewhere' }});
      t.same(iter.next(), { done: false, value: { tag: 'exit',  object: a }});
      t.same(iter.next(), { done: true,  value: void 0 });

      // Test late binding between driver and handler through handler option.
      t.is([...nullDriver.traverse(a, { handler: renderToHtml })].join(''),
        '<a href=location>somewhere</a>');
      t.is([...nullDriver.traverse(container, { handler: renderToHtml })].join(''),
        '<div class=custom-container>some text</div>');

      // Test driver control pane.
      let tested = false;
      const driver = new Driver(function handle(tag, object) {
        if(!tested && tag === 'enter') {
          tested = true;

          t.is(object, a);

          t.is(this.skipChildren(object), this);
          t.throws(() => this.skipChildren(), CODE_INVALID_ARG_VALUE);
          t.throws(() => this.skipChildren(container), CODE_INVALID_ARG_VALUE);

          t.is(this.replaceChildren(object, 665), this);
          t.throws(() => this.replaceChildren(void 0, 665), CODE_INVALID_ARG_VALUE);
          t.throws(() => this.replaceChildren(container, 665), CODE_INVALID_ARG_VALUE);
          t.throws(() => this.replaceChildren(object), CODE_INVALID_ARG_TYPE);

          t.is(this.provideContext(object, {}), this);
          t.throws(() => this.provideContext(void 0, {}), CODE_INVALID_ARG_VALUE);
          t.throws(() => this.provideContext(container, {}), CODE_INVALID_ARG_VALUE);
          t.throws(() => this.provideContext(a, 665), CODE_INVALID_ARG_TYPE);
        }
      });

      t.is(driver[toStringTag], 'Proact.Driver');

      iter = driver.traverse(a);
      t.throws(() => driver.traverse(), CODE_RESOURCE_BUSY);

      let done; // eslint-disable-line no-unused-vars
      while( !({ done } = iter.next()) );

      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  const deep = Element('a', null, Element('b', null, Element('i', null, 'nested')));

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
            return t.fail(`${result.length} attributes where 0 or 1 expected`);
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
      // >>> Built-in HTML handler invoked with invalid tag.
      t.throws(() => renderToHtml('mad'), CODE_INVALID_ARG_VALUE);

      // >>> Custom handler overriding built-in HTML handler.
      t.is([
        ...new Driver(new Proxy(renderToHtml, {
          apply(target, that, [tag, object]) {
            try {
              return Reflect.apply(target, that, [tag, object]);
            } finally {
              if( tag === 'enter' && object.name === 'b' ) that.skipChildren(object);
            }
          }
        })).traverse(deep)
      ].join(''), '<a><b></b></a>');

      t.end();
    });

    t.end();
  });

  // -----------------------------------------------------------------------------------------------

  t.test('Proact', t => {
    t.test('.renderToString()', t => {
      // >>> Deeply nested elements. See above for version with custom handler.
      t.is(renderToString(deep), '<a><b><i>nested</i></b></a>');

      // >>> Elements with and without attributes/properties.
      const Link = Component.from(function renderLink(props, children) {
        return Element('a', props, children);
      }, 'Link');

      t.is(renderToString(Link('landing page')),
        '<a>landing page</a>');
      t.is(renderToString(Link(null, 'landing page')),
        '<a>landing page</a>');
      t.is(renderToString(Link(a)),
        '<a><a href=location>somewhere</a></a>');
      t.is(renderToString(Link({ href: 'apparebit.com', rel: 'home' }, 'landing page')),
        '<a href=apparebit.com rel=home>landing page</a>');
      t.is(renderToString(Link(Link, { href: 'apparebit.com', rel: 'home' }, 'landing page')),
        '<a href=apparebit.com rel=home>landing page</a>');
      t.is(renderToString(Link(Link, 'landing page')),
        '<a>landing page</a>');

      const Unlink = H(function renderLink(props, children) {
        return Element('a', props, children);
      });

      t.is(renderToString(Unlink('Hello, world!')),
        '<a>Hello, world!</a>');
      t.is(renderToString(Unlink({ role: 'homebody' }, 'Hello, world!')),
        '<a role=homebody>Hello, world!</a>');

      // >>> Void elements.
      t.is(renderToString(Element('hr')), '<hr>');
      t.throws(() => renderToString(Element('hr', {}, 'but, but, but!')),
        CODE_INVALID_ARG_VALUE);

      // >>> <html> element with preceeding doctype.
      t.is(renderToString(Element('html')), '<!doctype html><html></html>');

      // >>> Ignored values.
      t.is(renderToString(Element('span', {}, void 0, null, '', true, false, ['W', 0, 0, 't!'])),
        '<span>W00t!</span>');

      // >>> Text with consecutive whitespace and escapable characters.
      t.is(renderToString(Element('span', null, '\t\t\n  <BOO>    &\n\nso\non')),
        '<span> &lt;BOO&gt; &amp; so on</span>');

      // >>> Element with raw text as content.
      t.is(renderToString(Element('script', {}, '42 < 665 && 13 > 2')),
        '<script>42 < 665 && 13 > 2</script>');
      t.is(renderToString(Element('script', null, `<!-- ooh -->'<script></script>'`)),
        `<script><\\!-- ooh -->'<\\script><\\/script>'</script>`);
      t.is(renderToString(Element('style', null, '.danger { color: red; }')),
        '<style>.danger { color: red; }</style>');

      // >>> Values other than nodes.
      t.is(renderToString(665), '665');
      t.is(renderToString([6, 6, 5].reverse()), '665');
      t.throws(() => renderToString(Element('span', null, new TypeError())),
        CODE_INVALID_ARG_TYPE);
      t.throws(() => renderToString(Element('span', null, Symbol('oops'))),
        CODE_INVALID_ARG_TYPE);

      // >>> Components that render to undefined.
      t.is(renderToString(Component.from(function ToUndefined() {
        return void 0;
      })()), '');

      // >>> Components that render to lists.
      t.is(renderToString(Component.from(function ToMany(props, children) {
        return [...children, ' ', ...children, ' ', ...children];
      })({}, 'w00t!')), 'w00t! w00t! w00t!');

      t.end();
    });

    t.test('.renderToStream()', t => {
      let resolve, reject;
      const promise = new Promise((yay, nay) => {
        resolve = yay;
        reject = nay;
      });

      const fragments = [];
      const collect = chunk => fragments.push(chunk);
      const validate = () => {
        t.is(fragments.join(''), '<a><b><i>nested</i></b></a>');
        t.end();

        resolve(true);
      };

      renderToStream(deep)
        .on('data', collect)
        .on('end', validate)
        .on('error', reject);

      return promise;
    });

    t.end();
  });

  t.end();
});
