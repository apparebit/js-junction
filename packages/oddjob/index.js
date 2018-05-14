/* (c) Copyright 2017–2018 Robert Grimm */

export {
  toKeyPath,
  withExistingKeyPath,
  withKeyPath,
} from './key-path';

export {
  configurable,
  constant,
  enumerable,
  value,
  writable,
} from './descriptors';

export {
  isIterable,
  isIterator,
  IteratorPrototype,
} from './iteration';

export {
  deobjectify,
  maybe,
  memoize,
} from './functions';

export {
  onExit,
  withoutInspector,
} from './processes';

export {
  muteWritable,
} from './streams';

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
