/* (C) Copyright 2018 Robert Grimm */

import stream from 'stream';
import Component from './vdom/component';
import Driver from './driver';
import renderToHtml from './html/render';

export function componentize(renderFn, name = renderFn.name) {
  return Component.from(renderFn, name);
}

export { default as h } from './hyperscript';

const defaultDriver = new Driver();
export const renderHtml = renderToHtml.bind(defaultDriver);

export function renderToString(node, {
  context = {},
  driver = defaultDriver,
} = {}) {
  return [...driver.traverse(node, { context, handler: renderHtml })].join('');
}

export function renderToStream(node, {
  context = {},
  driver = defaultDriver,
} = {}) {
  const renderer = driver.traverse(node, { context, handler: renderHtml });

  return new stream.Readable({
    read() {
      while( true ) {
        const { value, done } = renderer.next();

        // 1.  Per Readable's documentation, do not call push on empty strings.
        // 2.  However, do call push on null at the end-of-stream.
        // 3.  If Readable has no more internal buffer space or traversal is done,
        //     then return from read(). In the former case, Readable calls again
        //     when sufficient buffer space has become available.
        if( value !== '' && (!this.push(done ? null : value) || done) ) break;
      }
    }
  });
}
