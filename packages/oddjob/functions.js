/* (c) Copyright 2017 Robert Grimm */

export function maybe(fn, ...args) {
  if( args.length ) {
    for( const arg of args ) {
      if( arg == null ) return null;
    }

    return fn(...args);
  }

  return new Proxy(fn, { apply(target, that, args) {
    for( const arg of args ) {
      if( arg == null ) return null;
    }

    return Reflect.apply(target, that, args);
  }});
}
