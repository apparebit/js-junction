/* (C) Copyright 2018 Robert Grimm */

import { Readable } from 'stream';
import Component from './vdom/component';
import Driver from './driver';
import doRenderToHtml from './html/render';

export const H = Component.from;
export { default as h } from './hyperscript';

const defaultDriver = new Driver();
export const renderToHtml = doRenderToHtml;

export function renderToString(
  node,
  { context = {}, driver = defaultDriver, handler = renderToHtml } = {},
) {
  return [...driver.traverse(node, { context, handler })].join('');
}

export function renderToStream(
  node,
  { context = {}, driver = defaultDriver, handler = renderToHtml } = {},
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
