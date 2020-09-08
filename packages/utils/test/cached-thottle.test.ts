import * as sinon from 'sinon';
import cachedThrottle from '../src/cached-throttle';

const chai = require('chai');
const expect = chai.expect;

// tslint:disable:no-magic-numbers
describe('Cached Throttle', () => {
  it('throttles a function', async () => {
    const getTime = cachedThrottle(Math.random, 1000);
    const clock = sinon.useFakeTimers();

    const firstCall = getTime();
    expect(firstCall).to.be.equal(getTime());

    clock.tick(500);
    expect(firstCall).to.be.equal(getTime());

    clock.tick(500);
    expect(firstCall).to.not.be.equal(getTime());

    sinon.restore();
  });

  it('no throttle if delay is set to 0', async () => {
    const getTime = cachedThrottle(Math.random, 0);
    const clock = sinon.useFakeTimers();

    const firstCall = getTime();
    expect(firstCall).to.not.be.equal(getTime());

    clock.tick(10);
    expect(firstCall).to.not.be.equal(getTime());

    sinon.restore();
  });
});
