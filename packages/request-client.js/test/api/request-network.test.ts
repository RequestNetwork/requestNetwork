import { DataAccess as DataAccessTypes } from '@requestnetwork/types';
import { assert, expect } from 'chai';

import 'mocha';
import RequestNetwork from '../../src/api/request-network';

import Request from '../../src/api/request';

import * as TestData from '../data-test';

const mockDataAccess: DataAccessTypes.IDataAccess = {
  async getTransactionsByTopic(): Promise<any> {
    return;
  },
  async initialize(): Promise<any> {
    return;
  },
  async persistTransaction(): Promise<any> {
    return;
  },
};

describe('api/request-network', () => {
  // Most of the tests are done as integration tests in ../index.test.ts
  it('exists', async () => {
    assert.exists(RequestNetwork);

    const requestnetwork = new RequestNetwork(mockDataAccess);
    assert.isFunction(requestnetwork.createRequest);
    assert.isFunction(requestnetwork.fromRequestId);
  });

  describe('fromRequestId', () => {
    it('can get request with payment network fromRequestId', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async getTransactionsByTopic(): Promise<any> {
          return {
            result: { transactions: [{ data: JSON.stringify(TestData.action) }] },
          };
        },
        async initialize(): Promise<any> {
          return;
        },
        async persistTransaction(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const request = await requestnetwork.fromRequestId(
        '0x4b97a5816a7a86d11aaec93e8ec3b253d916f7152935b97c85c7dc760ea1857a',
      );

      expect(request).to.instanceOf(Request);
    });
  });
});
