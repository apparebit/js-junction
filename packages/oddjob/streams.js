/* (c) Copyright 2018 Robert Grimm */

export function muteWritable(stream) {
  const { write } = stream;

  stream.write = (chunk, encoding, callback) => {
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof callback === 'function') {
      callback();
    }

    return true;
  };

  return function unmute() {
    stream.write = write;
    return stream;
  };
}
