/* (C) Copyright 2017 Robert Grimm */

import Tag from '../util/tags';
import { DuplicateBinding } from '@grr/oddjob';

const {
  ContainsPhrasing,
  Transparent,
  Unspecified,
  Void,
} = Tag.HTML.Content;

const ELEMENTS = new Map();

function setType(type) {
  return function binder(name) {
    /* istanbul ignore next */
    if( ELEMENTS.has(name) ) {
      throw DuplicateBinding(name, ELEMENTS.get(name), type);
    }
    ELEMENTS.set(name, type);
  };
}

[
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
].forEach(setType(Void));

[
  'abbr',
  'b',
  'bdi',
  'bdo',
  'button',
  'cite',
  'code',
  'data',
  'datalist',
  'dfn',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'kbd',
  'label',
  'legend',
  'mark',
  'meter',
  'output',
  'p',
  'pre',
  'progress',
  'q',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'time',
  'u',
  'var',
].forEach(setType(ContainsPhrasing));

[
  'a',
  'audio',
  'canvas',
  'del',
  'ins',
  'map',
  'object',
  'slot',
  'video',
].forEach(setType(Transparent));

[
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'caption',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'head',
  'header',
  'hgroup',
  'html',
  'iframe',
  'li',
  'main',
  'math',
  'menu',
  'nav',
  'noscript',
  'ol',
  'optgroup',
  'option',
  'picture',
  'rp',
  'script',
  'section',
  'select',
  'style',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'ul',
].forEach(setType(Unspecified));

export default function typeElement(name) {
  return ELEMENTS.get(name);
}
