/* (C) Copyright 2018 Robert Grimm */

class RenderContext {
  constructor() {
    this.todo = [];
    this.done = [];
  }

  forShallowNodes() {
    this.isShallowRender = true;
    return this;
  }

  pushItem(...values) {
    this.todo.unshift(...values);
    return this;
  }

  hasItem() {
    return this.todo.length;
  }

  popItem() {
    return this.todo.shift();
  }

  write(text) {
    this.done.push(text);
  }

  toString() {
    return this.done.join('');
  }
}

export default function createRenderContext() {
  return new RenderContext();
}
