import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import { assert } from 'chai';
import 'mocha';
import Request from '../../src/api/request';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

const mockRequestLogic: RequestLogicTypes.IRequestLogic = {
  async createRequest(): Promise<any> {
    return;
  },
  async acceptRequest(): Promise<any> {
    return { meta: {} };
  },
  async cancelRequest(): Promise<any> {
    return { meta: {} };
  },
  async increaseExpectedAmountRequest(): Promise<any> {
    return { meta: {} };
  },
  async reduceExpectedAmountRequest(): Promise<any> {
    return { meta: {} };
  },
  async getRequestById(): Promise<any> {
    return { meta: {}, result: {} };
  },
};

const signatureIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/request', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('exists', async () => {
    assert.exists(Request);

    const requestNetwork = new Request(mockRequestLogic, '1');
    assert.isFunction(requestNetwork.accept);
    assert.isFunction(requestNetwork.cancel);
    assert.isFunction(requestNetwork.increaseExpectedAmountRequest);
    assert.isFunction(requestNetwork.reduceExpectedAmountRequest);
    assert.isFunction(requestNetwork.getData);
    assert.isFunction(requestNetwork.pay);
    assert.isFunction(requestNetwork.refund);
    assert.isFunction(requestNetwork.getHistory);
  });

  describe('accept', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'acceptRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.accept(signatureIdentity);

      expect(spy).to.have.been.called.once;
    });
  });

  describe('cancel', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'cancelRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.cancel(signatureIdentity);

      expect(spy).to.have.been.called.once;
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'increaseExpectedAmountRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.increaseExpectedAmountRequest(3, signatureIdentity);

      expect(spy).to.have.been.called.once;
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'reduceExpectedAmountRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.reduceExpectedAmountRequest(3, signatureIdentity);

      expect(spy).to.have.been.called.once;
    });
  });

  describe('getData', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'getRequestById');

      const request = new Request(mockRequestLogic, '1');
      await request.getData();

      expect(spy).to.have.been.called.once;
    });
  });

  describe('pay', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.pay());
    });
  });

  describe('refund', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.refund());
    });
  });

  describe('getHistory', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.getHistory());
    });
  });
});
