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

    retry(throwFn, {
      maxRetries: 30,
      retryDelay: 2000, // 2s
      exponentialBackoffDelay: 1000, // 1s
      maxExponentialBackoffDelay: 122000, // 122s
    })();

    // Should call immediately
    expect(throwFn).toHaveBeenCalledTimes(1);

    // Call 2nd time after 3s
    jest.advanceTimersByTime(2999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(2);

    // Call 3rd time after 4s
    jest.advanceTimersByTime(3999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(4000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(3);

    // Call 4th time after 4s
    jest.advanceTimersByTime(5999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(6000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(4);

    // Call 5th time after 10s
    jest.advanceTimersByTime(9999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(4);
    jest.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(5);

    // Call 6th time after 18s
    jest.advanceTimersByTime(17999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(5);
    jest.advanceTimersByTime(18000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(6);

    // Call 7th time after 34s
    jest.advanceTimersByTime(33999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(6);
    jest.advanceTimersByTime(34000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(7);

    // Call 8th time after 66s
    jest.advanceTimersByTime(65999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(7);
    jest.advanceTimersByTime(66000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(8);

    // Call 9th time after 122s
    jest.advanceTimersByTime(121999);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(8);
    jest.advanceTimersByTime(122000);
    await Promise.resolve();
    expect(throwFn).toHaveBeenCalledTimes(9);

    jest.useRealTimers();
  });
});
