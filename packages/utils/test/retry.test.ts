import { retry } from '../src';

class TestClass {
  private value = 'private';
  public method(): string {
    return this.value;
  }
}

describe('Retry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('retries a sync function', () => {
    const spy = jest.fn();
    retry(spy)();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries an async function', async () => {
    const spy = jest.fn();
    const asyncSpy = (): Promise<any> => Promise.resolve(spy());
    await retry(asyncSpy)();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not throw when a function retries less than the retry limit', async () => {
    const spy = jest.fn();
    const maxRetries = 5;
    let retries = 0;
    function throwUntil(): Promise<any> {
      if (retries === maxRetries) {
        return Promise.resolve(spy());
      }
      retries++;
      throw new Error(`this method will throw ${maxRetries} times`);
    }

    await expect(retry(throwUntil, { maxRetries })()).resolves.not.toThrowError();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('throws when a function retries more than the retry limit', async () => {
    const spy = jest.fn();
    const maxRetries = 5;
    let retries = 0;
    function throwUntil(): Promise<any> {
      if (retries === maxRetries) {
        return Promise.resolve(spy());
      }
      retries++;
      throw new Error(`this function will throw ${maxRetries} times`);
    }

    await expect(retry(throwUntil, { maxRetries: maxRetries - 1 })()).rejects.toThrowError(
      `this function will throw ${maxRetries} times`,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('throws when a function always throws', async () => {
    function alwaysThrow(): Promise<any> {
      throw new Error('this function will allways throw');
    }

    await expect(retry(alwaysThrow)()).rejects.toThrowError('this function will allways throw');
  });

  it('does not loose context using arrow function', async () => {
    const test = new TestClass();

    await expect(retry(() => test.method())()).resolves.toBe('private');
  });

  it('does not loose context when using context parameter', async () => {
    const test = new TestClass();

    await expect(retry(test.method, { context: test })()).resolves.toBe('private');
  });

  it('waits for the delay before retring', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const throwOnce = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error(`thew`);
      })
      .mockImplementationOnce(() => Date.now());

    const retryDelay = 1000;

    const promise = retry(throwOnce, { retryDelay })();
    jest.advanceTimersByTime(500);
    expect(throwOnce).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    const callTime = await promise;

    expect(callTime).toBe(retryDelay);
    expect(throwOnce).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  /* eslint-disable no-magic-numbers */
  it('waits for the delay before retring (without fake timer)', async () => {
    let retrying = false;
    const spy = jest.fn(() => Date.now());

    function throwOnce(): Promise<any> {
      if (retrying) {
        return Promise.resolve(spy());
      }
      retrying = true;
      throw new Error(`thew`);
    }

    const now = Date.now();

    setTimeout(() => expect(spy).not.toHaveBeenCalled(), 200);
    const after = await retry(throwOnce, { retryDelay: 500 })();

    expect(after).toBeGreaterThanOrEqual(now + 500);
  });

  it('delay increases exponentially if using exponentialBackoff', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const throwFn = jest.fn().mockImplementation(() => {
      throw new Error(`threw`);
    });

    const retryPromise = retry(throwFn, {
      retryDelay: 0,
      // Exponential backoff starting at 1s, doubling after each retry, up to a maximum of 64s and max 7 retries, yielding a total of 8 call snad total timeout of 127s
      maxRetries: 7,
      exponentialBackoffDelay: 1000, // 1s
      maxExponentialBackoffDelay: 64000, // 64s
    })();

    // Should call immediately (1 total calls, 0ms total elapsed)
    expect(throwFn).toHaveBeenCalledTimes(1);

    expect(Date.now()).toBe(0);

    // 1st retry after 1s (2 total calls, 1000ms total elapsed)
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(2);
    expect(Date.now()).toBe(1000);

    // 2nd retry after 3s (3 total calls, 3000ms total elapsed)
    jest.advanceTimersByTime(1999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(3);
    expect(Date.now()).toBe(3000);

    // 3rd retry after 4s (4 total calls, 7000ms total elapsed)
    jest.advanceTimersByTime(3999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(4);
    expect(Date.now()).toBe(7000);

    // 4th retry after 8s (5 total calls, 15000ms total elapsed)
    jest.advanceTimersByTime(7999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(4);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(5);
    expect(Date.now()).toBe(15000);

    // 5th retry after 16s (6 total calls, 31000ms total elapsed)
    jest.advanceTimersByTime(15999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(5);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(6);
    expect(Date.now()).toBe(31000);

    // 6th retry after 32s (7 total calls, 63000ms total elapsed)
    jest.advanceTimersByTime(31999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(6);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(7);
    expect(Date.now()).toBe(63000);

    // 7th retry after 64s (8 total calls, 127000ms total elapsed)
    jest.advanceTimersByTime(63999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(7);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(8);
    expect(Date.now()).toBe(127000);

    // Reject and throw after the last retry
    await expect(retryPromise).rejects.toThrow('threw');

    // No further retries
    jest.advanceTimersByTime(1000000000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(8);
    expect(Date.now()).toBe(1000127000);

    jest.useRealTimers();
  });
});
