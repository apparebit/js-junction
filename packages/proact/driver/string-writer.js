/* (C) Copyright 2018 Robert Grimm */

const FRAGMENT = Symbol('fragment');

export default function StringWriter() {
  this[FRAGMENT] = [];
}

StringWriter.prototype.reset = function reset() {
  this[FRAGMENT] = [];
  return this;
};

StringWriter.prototype.write = function write(text) {
  this[FRAGMENT].push(text);
  return this;
};

StringWriter.prototype.toString = function toString() {
  return this[FRAGMENT].join('');
};
