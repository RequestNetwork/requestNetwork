/**
 * A method that calls the target function at most once every `minimumDelay` milliseconds and
 * returns the cached return value in the meantime.
 *
 * @param target The target function
 * @param minimumDelay The minimum delay between calls to the target function in milliseconds
 */
export default (target: any, minimumDelay: number): any => {
  if (!(target instanceof Function)) {
    throw new Error('Target can only be a function');
  }

  // The last cached response
  let cachedResponse: any = null;

  // the last time the function was called
  let lastCall = Number.NEGATIVE_INFINITY;

  return (...args: any[]): any => {
    if (Date.now() >= lastCall + minimumDelay) {
      lastCall = Date.now();
      cachedResponse = target(args);
    }

    return cachedResponse;
  };
};
