/* (C) Copyright 2017 Robert Grimm */

import Tag from '../util/tags';
import { DuplicateBinding } from '@grr/oddjob';

const {
  CommaSeparated,
  OnOff,
  TrueUndefined,
  TrueFalse,
  TrueFalseMixed,
  TrueFalseUndefined,
  YesNo,
} = Tag.HTML.Attribute;

const ATTRIBUTES = new Map();

function setType(type) {
  return function binder(name) {
    /* istanbul ignore next */
    if( ATTRIBUTES.has(name) ) {
      throw DuplicateBinding(name, ATTRIBUTES.get(name), type);
    }
    ATTRIBUTES.set(name, type);
  };
}

setType(TrueFalseMixed)('aria-checked');
setType(TrueFalseMixed)('aria-pressed');
setType(OnOff         )('autocomplete');
setType(YesNo         )('translate'   );

[
  'allowfullscreen',
  'allowpaymentrequest',
  'allowusermedia',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'typemustmatch',
].forEach(setType(TrueUndefined));

[
  // HTML
  'contenteditable',
  'draggable',
  'spellcheck',

  // ARIA
  'aria-atomic',
  'aria-busy',
  'aria-disabled',
  'aria-modal',
  'aria-multiline',
  'aria-multiselectable',
  'aria-readonly',
  'aria-required',

  // SVG
  'externalResourcesRequired',
  'preserveAlpha',
].forEach(setType(TrueFalse));

[
  'aria-expanded',
  'aria-grabbed',
  'aria-hidden',
  'aria-selected',
].forEach(setType(TrueFalseUndefined));

[
  'accept',
  'coords',
  'media',
  'sizes',
  'srcset',
].forEach(setType(CommaSeparated));

export default function typeAttribute(name) {
  return ATTRIBUTES.get(name);
}
