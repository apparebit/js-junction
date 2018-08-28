/* (C) Copyright 2018 Robert Grimm */

import { Readable } from 'stream';

// We mostly import here to export below. That helps with _not_ loading modules
// more than once, which is very problematic for singleton symbols.

// VDOM.
import Node from './vdom/node';
import Element from './vdom/element';
import Component from './vdom/component';

// VDOM Component Registry.
import { define, lookup } from './vdom/registry';

// Hyperscript aka h().
import hyperscript from './hyperscript';

// Driver and rendering callbacks.
import Driver from './driver';
import renderAttributes from './html/render-attributes';
import renderHtml from './html/render';

const defaultDriver = new Driver();

function renderToString(
  node,
  { context = {}, driver = defaultDriver, handler = renderHtml } = {}
) {
  return [...driver.traverse(node, { context, handler })].join('');
}

function renderToStream(
  node,
  { context = {}, driver = defaultDriver, handler = renderHtml } = {}
) {
  const renderer = driver.traverse(node, { context, handler });

  return new Readable({
    read() {
      while (true) {
        const { value, done } = renderer.next();

        // 1.  Per Readable's documentation, do not call push on empty strings.
        // 2.  However, do call push on null at the end-of-stream.
        // 3.  If Readable has no more internal buffer space or traversal is done,
        //     then return from read(). In the former case, Readable calls again
        //     when sufficient buffer space has become available.
        if (value !== '' && (!this.push(done ? null : value) || done)) break;
      }
    },
  });
}

export {
  Node,
  Element,
  Component,
  define,
  lookup,
  hyperscript,
  Driver,
  renderAttributes,
  renderHtml,
  renderToStream,
  renderToString,
};
