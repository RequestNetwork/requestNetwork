import 'mocha';
import * as sinon from 'sinon';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

import IntervalTimer from '../src/interval-timer';

let intervalTimer: IntervalTimer;
let clock: sinon.SinonFakeTimers;

// tslint:disable:no-magic-numbers
// tslint:disable:no-empty
describe('interval-timer', () => {
  beforeEach(async () => {
    intervalTimer = new IntervalTimer(async (): Promise<void> => {}, 1000);
    clock = sinon.useFakeTimers();
  });

  afterEach(async () => {
    sinon.restore();
  });

  it('should throw an error if started twice without stop() being called', async () => {
    intervalTimer.start();
    expect(() => intervalTimer.start()).to.throw('IntervalTimer already started');

    intervalTimer.stop();
  });

  it('should throw an error if stopped without start() being called', async () => {
    expect(() => intervalTimer.stop()).to.throw(
      `Can't stop IntervalTimer if it has not been started`,
    );
  });

  it('should periodically call the interval function provided when start() is called', async () => {
    // We use this function to flush the call stack
    // If we don't use this function, the fake timer will be increased before the interval function being called
    const flushCallStack = (): Promise<any> => {
      return new Promise(
        (resolve): any => {
          setTimeout(resolve, 0);
          clock.tick(1);
        },
      );
    };

    const callback = sinon.spy(async () => 0);

    intervalTimer = new IntervalTimer(callback, 1000);
    intervalTimer.start();

    expect(callback.callCount).to.equal(0);

    clock.tick(500);
    expect(callback.callCount).to.equal(0);

    clock.tick(600); // 1100
    expect(callback.callCount).to.equal(1);

    await flushCallStack();

    clock.tick(1000); // 2100
    expect(callback.callCount).to.equal(2);

    await flushCallStack();

    clock.tick(1000); // 3100
    expect(callback.callCount).to.equal(3);

    await flushCallStack();

    clock.tick(1000); // 4100
    expect(callback.callCount).to.equal(4);

    await flushCallStack();

    clock.tick(1000); // 5100
    expect(callback.callCount).to.equal(5);
  });

  it('should stop calling the interval function when stop() is called', async () => {
    const callback = sinon.spy();

    intervalTimer = new IntervalTimer(callback, 1000);
    intervalTimer.start();

    expect(callback.callCount).to.equal(0);
    clock.tick(1100);
    expect(callback.callCount).to.equal(1);

    intervalTimer.stop();

    clock.tick(1000); // 2100
    expect(callback.callCount).to.equal(1);
  });

  it('allows to restart the periodical call of the interval function', async () => {
    const callback = sinon.spy();

    intervalTimer = new IntervalTimer(callback, 1000);
    intervalTimer.start();

    expect(callback.callCount).to.equal(0);
    clock.tick(1100);
    expect(callback.callCount).to.equal(1);

    intervalTimer.stop();

    clock.tick(1000); // 2100
    expect(callback.callCount).to.equal(1);

    intervalTimer.start();

    clock.tick(1000); // 3100
    expect(callback.callCount).to.equal(2);
  });

  it('should not stop if the interval function fail', async () => {
    // We use this function to flush the call stack
    // If we don't use this function, the fake timer will be increased before the interval function being called
    const flushCallStack = (): Promise<any> => {
      return new Promise(
        (resolve): any => {
          setTimeout(resolve, 0);
          clock.tick(1);
        },
      );
    };

    // Trigger the rejection of the interval function
    let makeReject = false;

    // This value is used to check if the interval function has been rejected
    let hasBeenRejected = false;

    const callback = sinon.spy(async () => {
      if (makeReject) {
        hasBeenRejected = true;
        throw Error('makeReject set');
      }
      return 0;
    });

    intervalTimer = new IntervalTimer(callback, 1000);
    intervalTimer.start();

    expect(callback.callCount).to.equal(0);

    clock.tick(1100);
    expect(callback.callCount).to.equal(1);

    // Force the rejection of the interval function for the next call
    makeReject = true;
    await flushCallStack();

    clock.tick(1000);
    expect(callback.callCount).to.equal(2);

    makeReject = false;
    await flushCallStack();

    // The interval function should have been rejected
    await expect(hasBeenRejected).to.be.true;

    // The interval function should continue to be called
    clock.tick(1000);
    expect(callback.callCount).to.equal(3);
  });
});
