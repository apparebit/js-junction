/* (c) Copyright 2017–2018 Robert Grimm */

export { toKeyPath, withExistingKeyPath, withKeyPath } from './key-path';
export { deobjectify, maybe, memoize } from './functions';
export { onExit, withoutInspector } from './processes';
export { muteWritable } from './streams';

export {
  dehyphenate,
  escapeAttribute,
  escapeHTML,
  escapeScript,
  hyphenate,
  isAttributeQuoted,
  normalizeWhitespace,
  toStableJSON,
  toSymbolKey,
} from './strings';
