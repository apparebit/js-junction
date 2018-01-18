/* (c) Copyright 2017–2018 Robert Grimm */

export { default } from 'tap';

// Placed here to minimize impact of ESLint not being able to parse dynamic import form.
export function dynaload(name) {
  return import(name);
}
