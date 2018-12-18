import { RequestLogic as RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import RequestNetwork from '../../src/api/request-network';

const mockRequestLogic: RequestLogicTypes.IRequestLogic = {
  async createRequest(): Promise<any> {
    return;
  },
  async acceptRequest(): Promise<any> {
    return;
  },
  async cancelRequest(): Promise<any> {
    return;
  },
  async increaseExpectedAmountRequest(): Promise<any> {
    return;
  },
  async reduceExpectedAmountRequest(): Promise<any> {
    return;
  },
  async getRequestById(): Promise<any> {
    return;
  },
};

describe('api/request-network', () => {
  // Most of the tests are done as integration tests in ../index.test.ts
  it('exists', async () => {
    assert.exists(RequestNetwork);

    const requestnetwork = new RequestNetwork(mockRequestLogic);
    assert.isFunction(requestnetwork.createRequest);
    assert.isFunction(requestnetwork.fromRequestId);
  });
});
