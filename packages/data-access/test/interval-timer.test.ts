import * as sinon from 'sinon';

import { LogTypes } from '@requestnetwork/types';

import IntervalTimer from '../src/interval-timer';

let intervalTimer: IntervalTimer;
let clock: sinon.SinonFakeTimers;

// We use this function to flush the call stack
// If we don't use this function, the fake timer will be increased before the interval function being called
const flushCallStack = (): Promise<any> => {
  return new Promise((resolve): any => {
    setTimeout(resolve, 0);
    clock.tick(1);
  });
};

const emptyLogger = {
  debug: (_string: string): void => {},
  error: (_string: string): void => {},
  info: (_string: string): void => {},
  warn: (_string: string): void => {},
} as LogTypes.ILogger;

let intervalFunctionWithErrorCount: number;

// Mock to simulate cases where several interval function fail in a row
const intervalFunctionWithErrorMock = async (): Promise<void> => {
  intervalFunctionWithErrorCount++;

  switch (intervalFunctionWithErrorCount) {
    case 1:
      return;
    case 2:
      throw Error('Error 1');
    case 3:
      throw Error('Error 2');
    case 4:
      throw Error('Error 3');
    case 5:
      throw Error('Error 4');
    case 6:
      throw Error('Error 5');
    case 7:
      return;
    default:
      return;
  }
};

// tslint:disable:no-magic-numbers
// tslint:disable:no-empty
describe('interval-timer', () => {
  beforeEach(async () => {
    intervalTimer = new IntervalTimer(async (): Promise<void> => {}, 1000, emptyLogger);
    clock = sinon.useFakeTimers();
    intervalFunctionWithErrorCount = 0;
  });

  afterEach(async () => {
    sinon.restore();
  });

  it('should throw an error if started twice without stop() being called', async () => {
    intervalTimer.start();
    expect(() => intervalTimer.start()).toThrowError('IntervalTimer already started');

    intervalTimer.stop();
  });

  it('should throw an error if stopped without start() being called', async () => {
    expect(() => intervalTimer.stop()).toThrowError(
      `Can't stop IntervalTimer if it has not been started`,
    );
  });

  it('should periodically call the interval function provided when start() is called', async () => {
    const callback = sinon.spy(async () => {});

    intervalTimer = new IntervalTimer(callback, 1000, emptyLogger);
    intervalTimer.start();

    expect(callback.callCount).toEqual(0);

    clock.tick(500);
    expect(callback.callCount).toEqual(0);

    clock.tick(600); // 1100
    expect(callback.callCount).toEqual(1);

    await flushCallStack();

    clock.tick(1000); // 2100
    expect(callback.callCount).toEqual(2);

    await flushCallStack();

    clock.tick(1000); // 3100
    expect(callback.callCount).toEqual(3);

    await flushCallStack();

    clock.tick(1000); // 4100
    expect(callback.callCount).toEqual(4);

    await flushCallStack();

    clock.tick(1000); // 5100
    expect(callback.callCount).toEqual(5);
  });

  it('should stop calling the interval function when stop() is called', async () => {
    const callback = sinon.spy();

    intervalTimer = new IntervalTimer(callback, 1000, emptyLogger);
    intervalTimer.start();

    expect(callback.callCount).toEqual(0);
    clock.tick(1100);
    expect(callback.callCount).toEqual(1);

    intervalTimer.stop();

    clock.tick(1000); // 2100
    expect(callback.callCount).toEqual(1);
  });

  it('allows to restart the periodical call of the interval function', async () => {
    const callback = sinon.spy();

    intervalTimer = new IntervalTimer(callback, 1000, emptyLogger);
    intervalTimer.start();

    expect(callback.callCount).toEqual(0);
    clock.tick(1100);
    expect(callback.callCount).toEqual(1);

    intervalTimer.stop();

    clock.tick(1000); // 2100
    expect(callback.callCount).toEqual(1);

    intervalTimer.start();

    clock.tick(1000); // 3100
    expect(callback.callCount).toEqual(2);
  });

  it('should not stop if the interval function fail', async () => {
    // Trigger the rejection of the interval function
    let makeReject = false;

    // This value is used to check if the interval function has been rejected
    let hasBeenRejected = false;

    const callback = sinon.spy(async () => {
      if (makeReject) {
        hasBeenRejected = true;
        throw Error('makeReject set');
      }
      return;
    });

    intervalTimer = new IntervalTimer(callback, 1000, emptyLogger);
    intervalTimer.start();

    expect(callback.callCount).toEqual(0);

    clock.tick(1100);
    expect(callback.callCount).toEqual(1);

    // Force the rejection of the interval function for the next call
    makeReject = true;
    await flushCallStack();

    clock.tick(1000);
    expect(callback.callCount).toEqual(2);

    makeReject = false;
    await flushCallStack();

    // The interval function should have been rejected
    expect(hasBeenRejected).toBeTruthy();

    // The interval function should continue to be called
    clock.tick(1000);
    expect(callback.callCount).toEqual(3);
  });

  it('intervalFunctionSuccessiveFailureCount should be incremented when the interval function fails', async () => {
    intervalTimer = new IntervalTimer(intervalFunctionWithErrorMock, 1000, emptyLogger, 5);
    intervalTimer.start();

    // Simulate clock to call interval function
    clock.tick(1001);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(1);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(2);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(3);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(4);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(5);

    clock.tick(1000);
    await flushCallStack();
    expect(intervalTimer.intervalFunctionSuccessiveFailureCount).toEqual(0);
  });

  it('should display log messages when interval function fails', async () => {
    // Mock to test logger message
    const mockLogger = {
      debug: sinon.spy(),
      error: sinon.spy(),
      info: sinon.spy(),
      warn: sinon.spy(),
    };

    intervalTimer = new IntervalTimer(intervalFunctionWithErrorMock, 1000, mockLogger, 5);
    intervalTimer.start();

    // Simulate clock to call interval function
    clock.tick(1001);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(0);
    expect(mockLogger.error.callCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(1);
    expect(mockLogger.error.callCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(2);
    expect(mockLogger.error.callCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(3);
    expect(mockLogger.error.callCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(4);
    expect(mockLogger.error.callCount).toEqual(0);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(5);
    expect(mockLogger.error.callCount).toEqual(1);

    clock.tick(1000);
    await flushCallStack();
    expect(mockLogger.warn.callCount).toEqual(5);
    expect(mockLogger.error.callCount).toEqual(1);
  });
});
