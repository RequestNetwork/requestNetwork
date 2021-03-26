/**
 * A method that calls the target function at most once every `minimumDelay` milliseconds and
 * returns the cached return value in the meantime.
 *
 * @param target The target function
 * @param minimumDelay The minimum delay between calls to the target function in milliseconds
 */
export const cachedThrottle = <TParams extends unknown[], TReturn>(
  target: (...params: TParams) => Promise<TReturn>,
  minimumDelay: number,
): ((...params: TParams) => Promise<TReturn>) => {
  if (!(target instanceof Function)) {
    throw new Error('Target can only be a function');
  }

  // The last cached response
  let cachedResponse: Promise<TReturn> | null = null;

  // the last time the function was called
  let lastCall = Number.NEGATIVE_INFINITY;

  return (...args: TParams): Promise<TReturn> => {
    if (!cachedResponse || Date.now() >= lastCall + minimumDelay) {
      lastCall = Date.now();
      cachedResponse = target(...args);
    }

    return cachedResponse;
  };
};

export default cachedThrottle;
