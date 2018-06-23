/* (C) Copyright 2017–2018 Robert Grimm */

import Tags from './tags';

const {
  ContainsPhrasing,
  EscapableRawText,
  RawText,
  Transparent,
  Unspecified,
  Void,
} = Tags.HTML.Content;

const HTML = new Map();

function addType(type) {
  return function toTagName(tag) {
    if (!HTML.has(tag)) HTML.set(tag, []);
    HTML.get(tag).push(type);
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
].forEach(addType(Void));

addType(RawText)('script');
addType(RawText)('style');
addType(EscapableRawText)('title');
addType(EscapableRawText)('textarea');

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
].forEach(addType(ContainsPhrasing));

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
].forEach(addType(Transparent));

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
].forEach(addType(Unspecified));

function toTag(value) {
  return String(value).toLowerCase();
}

function hasType(tag, ...types) {
  const actual = HTML.get(String(tag).toLowerCase());

  if (actual) {
    for (const type of types) {
      if (actual.includes(type)) return true;
    }
  }

  return false;
}

export function isHtmlElement(value) {
  return HTML.has(toTag(value));
}

export function isVoidElement(value) {
  return hasType(toTag(value), Void);
}

export function hasRawText(value) {
  return hasType(toTag(value), EscapableRawText, RawText);
}
