/* (c) Copyright 2018 Robert Grimm */

const { execArgv } = process;

const WITH_INSPECTOR = new RegExp(`^(${['', '-brk', '-port']
  .map(suffix => [`--inspect${suffix}`, `--debug${suffix}`])
  .reduce((flags, pair) => [...flags, ...pair])
  .join('|')})(?:=(\\d+))?$`, 'u');

export function withoutInspector(args = execArgv) {
  const result = [];

  for( const arg of args ) {
    if( !arg.match(WITH_INSPECTOR) ) {
      result.push(arg);
    }
  }

  return result;
}
