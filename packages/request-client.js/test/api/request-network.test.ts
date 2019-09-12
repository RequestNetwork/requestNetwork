import { DataAccessTypes } from '@requestnetwork/types';

import { assert, expect } from 'chai';

import 'mocha';
import RequestNetwork from '../../src/api/request-network';

import Request from '../../src/api/request';

import * as TestData from '../data-test';

const mockDataAccess: DataAccessTypes.IDataAccess = {
  async getChannelsByTopic(): Promise<any> {
    return;
  },
  async getTransactionsByChannelId(): Promise<any> {
    return;
  },
  async initialize(): Promise<any> {
    return;
  },
  async persistTransaction(): Promise<any> {
    return;
  },
  async getChannelsByMultipleTopics(): Promise<any> {
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

  describe('createRequest', () => {
    it('cannot createRequest() with extensionsData', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async getChannelsByTopic(): Promise<any> {
          return;
        },
        async getTransactionsByChannelId(): Promise<any> {
          return;
        },
        async initialize(): Promise<any> {
          return;
        },
        async persistTransaction(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);

      try {
        await requestnetwork.createRequest({
          requestInfo: { extensionsData: ['not expected'] } as any,
          signer: {} as any,
        });
        // tslint:disable-next-line:no-unused-expression
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message, 'exception wrong').to.equal(
          'extensionsData in request parameters must be empty',
        );
      }
    });
  });

  describe('fromRequestId', () => {
    // skip the check that randomly timeout because of the bitcoin provider
    it.skip('can get request with payment network fromRequestId', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async getChannelsByTopic(): Promise<any> {
          return;
        },
        async getTransactionsByChannelId(): Promise<any> {
          return {
            result: {
              transactions: [TestData.transactionConfirmed],
            },
          };
        },
        async initialize(): Promise<any> {
          return;
        },
        async persistTransaction(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const request = await requestnetwork.fromRequestId(TestData.actionRequestId);

      expect(request).to.instanceOf(Request);
    });
  });

  describe('fromIdentity', () => {
    // skip the check that randomly timeout because of the bitcoin provider
    it.skip('can get requests with payment network fromIdentity', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async getChannelsByTopic(topic: string): Promise<any> {
          expect(topic).to.equals(
            '01f1a21ab419611dbf492b3136ac231c8773dc897ee0eb5167ef2051a39e685e76',
          );
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.transactionConfirmed],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.transactionConfirmedSecondRequest,
                ],
              },
            },
          };
        },
        async getTransactionsByChannelId(channelId: string): Promise<any> {
          let transactions: any[] = [];
          if (channelId === TestData.actionRequestId) {
            transactions = [
              {
                timestamp: TestData.arbitraryTimestamp,
                transaction: {
                  data: JSON.stringify(TestData.action),
                },
              },
            ];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.transactionConfirmedSecondRequest];
          }
          return {
            result: {
              transactions,
            },
          };
        },
        async initialize(): Promise<any> {
          return;
        },
        async persistTransaction(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const requests: Request[] = await requestnetwork.fromIdentity(TestData.payee.identity);

      expect(requests.length).to.be.equal(2);
      expect(requests[0].requestId).to.be.equal(TestData.actionRequestId);
      expect(requests[1].requestId).to.be.equal(TestData.actionRequestIdSecondRequest);
    });
    it('cannot get request with identity type not supported', async () => {
      const requestnetwork = new RequestNetwork(mockDataAccess);

      await expect(
        requestnetwork.fromIdentity({ type: 'not supported', value: 'whatever' } as any),
      ).to.eventually.be.rejectedWith('not supported is not supported');
    });
  });

  describe('fromTopic', () => {
    it('can get requests with payment network fromTopic', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async getChannelsByTopic(): Promise<any> {
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.transactionConfirmed],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.transactionConfirmedSecondRequest,
                ],
              },
            },
          };
        },
        async getTransactionsByChannelId(channelId: string): Promise<any> {
          let transactions: any[] = [];
          if (channelId === TestData.actionRequestId) {
            transactions = [TestData.transactionConfirmed];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.transactionConfirmedSecondRequest];
          }
          return {
            result: {
              transactions,
            },
          };
        },
        async initialize(): Promise<any> {
          return;
        },
        async persistTransaction(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const requests: Request[] = await requestnetwork.fromIdentity(TestData.payee.identity);

      expect(requests.length).to.be.equal(2);
      expect(requests[0].requestId).to.be.equal(TestData.actionRequestId);
      expect(requests[1].requestId).to.be.equal(TestData.actionRequestIdSecondRequest);
    });
    it('cannot get request with identity type not supported', async () => {
      const requestnetwork = new RequestNetwork(mockDataAccess);

      await expect(
        requestnetwork.fromIdentity({ type: 'not supported', value: 'whatever' } as any),
      ).to.eventually.be.rejectedWith('not supported is not supported');
    });
  });
});
