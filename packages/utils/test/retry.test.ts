import 'mocha';
import * as sinon from 'sinon';
import retry from '../src/retry';

const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

class TestClass {
  private value = 'private';
  public method(): string {
    return this.value;
  }
}

describe('Retry', () => {
  it('retries a sync function', () => {
    const spy = chai.spy();
    retry(spy)();
    expect(spy).to.have.been.called.once;
  });

  it('retries an async function', async () => {
    const spy = chai.spy();
    const asyncSpy = (): Promise<any> => Promise.resolve(spy());
    await retry(asyncSpy)();
    expect(spy).to.have.been.called.once;
  });

  it('does not throw when a function retries less than the retry limit', async () => {
    const spy = chai.spy();
    const maxRetries = 5;
    let retries = 0;
    function throwUntil(): Promise<any> {
      if (retries === maxRetries) {
        return Promise.resolve(spy());
      }
      retries++;
      throw new Error(`this method will throw ${maxRetries} times`);
    }

    await expect(retry(throwUntil, { maxRetries })()).to.eventually.be.fulfilled;
    expect(spy).to.have.been.called.once;
  });

  it('throws when a function retries more than the retry limit', async () => {
    const spy = chai.spy();
    const maxRetries = 5;
    let retries = 0;
    function throwUntil(): Promise<any> {
      if (retries === maxRetries) {
        return Promise.resolve(spy());
      }
      retries++;
      throw new Error(`this function will throw ${maxRetries} times`);
    }

    await expect(
      retry(throwUntil, { maxRetries: maxRetries - 1 })(),
      'should throw',
    ).to.eventually.be.rejectedWith(`this function will throw ${maxRetries} times`);
    expect(spy).to.not.have.been.called.once;
  });

  it('throws when a function always throws', async () => {
    function alwaysThrow(): Promise<any> {
      throw new Error('this function will allways throw');
    }

    await expect(retry(alwaysThrow)(), 'should throw').to.eventually.be.rejectedWith(
      'this function will allways throw',
    );
  });

  it('does not loose context using arrow function', async () => {
    const test = new TestClass();

    await expect(retry(() => test.method())(), 'should throw').to.eventually.equal('private');
  });

  it('does not loose context when using context parameter', async () => {
    const test = new TestClass();

    await expect(retry(test.method, { context: test })(), 'should throw').to.eventually.equal(
      'private',
    );
  });

  it('waits for the delay before retring', async () => {
    const clock = sinon.useFakeTimers();

    const spy = chai.spy(() => Date.now());
    let retrying = false;
    function throwOnce(): Promise<any> {
      if (retrying) {
        return Promise.resolve(spy());
      }
      retrying = true;
      throw new Error(`thew`);
    }

    const retryDelay = 1000;
    setTimeout(() => expect(spy).to.not.have.been.called.once, 500);

    const promise = retry(throwOnce, { retryDelay })();

    clock.tick(retryDelay);
    const callTime = await promise;

    expect(callTime).to.be.equal(retryDelay);
    expect(spy).to.have.been.called.once;

    sinon.restore();
  });

  /* tslint:disable:no-magic-numbers */
  it('waits for the delay before retring (without fake timer)', async () => {
    let retrying = false;
    const spy = chai.spy(() => Date.now());

    function throwOnce(): Promise<any> {
      if (retrying) {
        return Promise.resolve(spy());
      }
      retrying = true;
      throw new Error(`thew`);
    }

    const now = Date.now();

    setTimeout(() => expect(spy).to.not.have.been.called.once, 200);
    const after = await retry(throwOnce, { retryDelay: 500 })();

    expect(after).to.be.at.least(now + 500);
  });
});
