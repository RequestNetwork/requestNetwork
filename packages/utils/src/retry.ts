// Default amount of retries!
const DEFAULT_MAX_RETRIES = 5;

// Default delay between retries
const DEFAULT_RETRY_DELAY = 100;

/**
 * A method that retries a function a defined amount of times if it fails.
 *
 * @param target The target function
 * @param [options] Retry configuration options
 * @param [options.context] The context to run the function
 * @param [options.maxRetries=DEFAULT_MAX_RETRIES] The maximum amount of retries for the function
 * @param [options.retryDelay=DEFAULT_RETRY_DELAY] The delay between retries
 */
export const retry = <TParams extends unknown[], TReturn>(
  target: (...params: TParams) => TReturn | Promise<TReturn>,
  {
    context,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
  }: {
    context?: ThisParameterType<(...params: TParams) => Promise<TReturn>>;
    maxRetries?: number;
    retryDelay?: number;
  } = {},
): ((...params: TParams) => Promise<TReturn>) => {
  // If a context was passed in, bind it to to the target function
  if (context) {
    target = target.bind(context);
  }

  // Returns an external function that will contain the retry counter
  return async (...args: TParams): Promise<TReturn> => {
    // The current amount of retries
    let retry = 0;

    // Returns the retrying function that can be called
    return (async function retryFunction(...innerArgs: TParams): Promise<TReturn> {
      try {
        // Call the target function with the target object as context
        return await target(...innerArgs);
      } catch (e) {
        // If the function throws, try again if we have retries left
        if (retry < maxRetries) {
          retry++;
          // Wait for the delay before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          return retryFunction(...innerArgs);
        } else {
          // If no retries are left, throw the error
          throw e;
        }
      }
    })(...args);
  };
};

export default retry;
