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
    intervalTimer = new IntervalTimer(() => {}, 1000);
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
    const callback = sinon.spy();

    intervalTimer = new IntervalTimer(callback, 1000);
    intervalTimer.start();

    expect(callback.callCount).to.equal(0);

    clock.tick(500);
    expect(callback.callCount).to.equal(0);

    clock.tick(600); // 1100
    expect(callback.callCount).to.equal(1);

    clock.tick(1000); // 2100
    expect(callback.callCount).to.equal(2);

    clock.tick(3000); // 5100
    expect(callback.callCount).to.equal(5);

    clock.tick(100); // 5200
    expect(callback.callCount).to.equal(5);

    clock.tick(5000); // 10200
    expect(callback.callCount).to.equal(10);
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
});
