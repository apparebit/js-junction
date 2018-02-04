/* (C) Copyright 2017–2018 Robert Grimm */

import stream from 'stream';
import Element from './vdom/element';
import Component from './vdom/component';
import Driver from './driver';
import doRenderHTML from './html/render';

const { freeze } = Object;

const driver = new Driver();
const renderHTML = doRenderHTML.bind(driver);

function renderToString(node, context = {}) {
  return [...driver.traverse(node, { context, handler: renderHTML })].join('');
}

function renderToStream(node, context = {}) {
  const renderer = driver.traverse(node, { context, handler: renderHTML });

  return new stream.Readable({
    read() {
      while( true ) {
        const { value, done } = renderer.next();
        if( value !== '' && (!this.push(done ? null : value) || done) ) break;
      }
    }
  });
}

export default freeze({
  __proto__: null,
  Element,
  Component,
  renderToString,
  renderToStream,
});
