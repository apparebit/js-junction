/* (c) Copyright 2018 Robert Grimm */

let current;

export default function driver() {
  return current;
}

export function setDriver(newDriver) {
  const oldDriver = current;
  current = newDriver;
  return oldDriver;
}
