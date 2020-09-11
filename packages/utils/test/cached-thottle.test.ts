import cachedThrottle from '../src/cached-throttle';

// tslint:disable:no-magic-numbers
describe('Cached Throttle', () => {
  it('throttles a function', async () => {
    jest.useFakeTimers('modern');
    const getTime = cachedThrottle(() => Math.random(), 1000);

    const firstCall = getTime();
    expect(firstCall).toBe(getTime());

    jest.advanceTimersByTime(500);
    expect(firstCall).toBe(getTime());

    jest.advanceTimersByTime(500);
    expect(firstCall).not.toBe(getTime());

    jest.useRealTimers();
  });

  it('no throttle if delay is set to 0', async () => {
    const getTime = cachedThrottle(() => Math.random(), 0);
    jest.useFakeTimers('modern');

    const firstCall = getTime();
    expect(firstCall).not.toBe(getTime());

    jest.advanceTimersByTime(10);
    expect(firstCall).not.toBe(getTime());

    jest.useRealTimers();
  });
});
