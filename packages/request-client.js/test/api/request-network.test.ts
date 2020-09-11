/* eslint-disable spellcheck/spell-checker */
import MultiFormat from '@requestnetwork/multi-format';
import { DataAccessTypes, SignatureTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import RequestNetwork from '../../src/api/request-network';

import Request from '../../src/api/request';

import * as TestData from '../data-test';

const mockDataAccess: DataAccessTypes.IDataAccess = {
  async _getStatus(): Promise<any> {
    return;
  },
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
    expect(RequestNetwork).toBeDefined();

    const requestnetwork = new RequestNetwork(mockDataAccess);
    // tslint:disable-next-line: no-unbound-method
    expect(typeof requestnetwork.createRequest).toBe('function');
    // tslint:disable-next-line: no-unbound-method
    expect(typeof requestnetwork.fromRequestId).toBe('function');
  });

  describe('createRequest', () => {
    it('cannot createRequest() with extensionsData', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
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

      await expect(
        requestnetwork.createRequest({
          requestInfo: { extensionsData: ['not expected'] } as any,
          signer: {} as any,
        }),
      ).rejects.toThrowError('extensionsData in request parameters must be empty');
    });
  });

  describe('fromRequestId', () => {
    it('can get request with payment network fromRequestId', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByTopic(): Promise<any> {
          return;
        },
        async getTransactionsByChannelId(): Promise<any> {
          return {
            result: {
              transactions: [TestData.timestampedTransaction],
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

      expect(request).toBeInstanceOf(Request);
    });

    it('cannot get request fromRequestId with if transactions are ignored', async () => {
      const txIgnoredByTransactionManager: TransactionTypes.ITimestampedTransaction = {
        state: DataAccessTypes.TransactionState.PENDING,
        timestamp: 1549953337,
        transaction: { data: 'broken transaction' },
      };
      const actionWrongSigner = Utils.signature.sign(TestData.data, {
        method: SignatureTypes.METHOD.ECDSA,
        privateKey: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      });

      const txIgnoredByRequestLogic: TransactionTypes.ITimestampedTransaction = {
        state: DataAccessTypes.TransactionState.PENDING,
        timestamp: 1549953338,
        transaction: {
          data: JSON.stringify(actionWrongSigner),
        },
      };
      const requestId = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(actionWrongSigner),
      );

      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByTopic(): Promise<any> {
          return;
        },
        async getTransactionsByChannelId(): Promise<any> {
          return {
            result: {
              transactions: [txIgnoredByTransactionManager, txIgnoredByRequestLogic],
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
      await expect(requestnetwork.fromRequestId(requestId)).rejects.toThrowError(
        `Invalid transaction(s) found: [{"reason":"Impossible to JSON parse the transaction","transaction":{"state":"pending","timestamp":1549953337,"transaction":{"data":"broken transaction"}}},{"reason":"Signer must be the payee or the payer","transaction":{"action":{"data":{"name":"create","parameters":{"currency":{"network":"testnet","type":"BTC","value":"BTC"},"expectedAmount":"100000000000","extensionsData":[{"action":"create","id":"pn-testnet-bitcoin-address-based","parameters":{"paymentAddress":"mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v"},"version":"0.1.0"}],"payee":{"type":"ethereumAddress","value":"0x627306090abab3a6e1400e9345bc60c78a8bef57"},"payer":{"type":"ethereumAddress","value":"0xf17f52151ebef6c7334fad080c5704d77216b732"},"timestamp":1549953337},"version":"2.0.3"},"signature":{"method":"ecdsa","value":"0xba762b281fb82cb317221ec87666d04b793e77013f9ca3951d59b4ba1e1f9554508a462ebafabd1ca4de2b6c25e878e74d1891cc1732001e5c0d8c59cb0ffa371b"}},"state":"pending","timestamp":1549953338}}]`,
      );
    });
  });

  describe('fromIdentity', () => {
    it('can get requests with payment network fromIdentity', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByTopic(topic: string): Promise<any> {
          expect(topic).toBe('01f1a21ab419611dbf492b3136ac231c8773dc897ee0eb5167ef2051a39e685e76');
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.timestampedTransaction],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.timestampedTransactionSecondRequest,
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
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: TestData.arbitraryTimestamp,
                transaction: {
                  data: JSON.stringify(TestData.action),
                },
              },
            ];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.timestampedTransactionSecondRequest];
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

      expect(requests.length).toBe(2);
      expect(requests[0].requestId).toBe(TestData.actionRequestId);
      expect(requests[1].requestId).toBe(TestData.actionRequestIdSecondRequest);
    });
    it('cannot get request with identity type not supported', async () => {
      const requestnetwork = new RequestNetwork(mockDataAccess);

      await expect(
        requestnetwork.fromIdentity({ type: 'not supported', value: 'whatever' } as any),
      ).rejects.toThrowError('not supported is not supported');
    });
  });

  describe('fromTopic', () => {
    it('can get requests with payment network fromTopic', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByTopic(): Promise<any> {
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.timestampedTransaction],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.timestampedTransactionSecondRequest,
                ],
              },
            },
          };
        },
        async getTransactionsByChannelId(channelId: string): Promise<any> {
          let transactions: any[] = [];
          if (channelId === TestData.actionRequestId) {
            transactions = [TestData.timestampedTransaction];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.timestampedTransactionSecondRequest];
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
      const requests: Request[] = await requestnetwork.fromTopic(TestData.payee.identity);

      expect(requests.length).toBe(2);
      expect(requests[0].requestId).toBe(TestData.actionRequestId);
      expect(requests[1].requestId).toBe(TestData.actionRequestIdSecondRequest);
    });
  });

  describe('fromMultipleIdentities', () => {
    it('can get requests with payment network from multiple Identities', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(topics: [string]): Promise<any> {
          expect(topics).toEqual([
            '01f1a21ab419611dbf492b3136ac231c8773dc897ee0eb5167ef2051a39e685e76',
          ]);
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.timestampedTransaction],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.timestampedTransactionSecondRequest,
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
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: TestData.arbitraryTimestamp,
                transaction: {
                  data: JSON.stringify(TestData.action),
                },
              },
            ];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.timestampedTransactionSecondRequest];
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
        async getChannelsByTopic(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const requests: Request[] = await requestnetwork.fromMultipleIdentities([
        TestData.payee.identity,
      ]);

      expect(requests.length).toBe(2);
      expect(requests[0].requestId).toBe(TestData.actionRequestId);
      expect(requests[1].requestId).toBe(TestData.actionRequestIdSecondRequest);
    });
    it('cannot get request with identity type not supported', async () => {
      const requestnetwork = new RequestNetwork(mockDataAccess);

      await expect(
        requestnetwork.fromMultipleIdentities([
          { type: 'not supported', value: 'whatever' } as any,
        ]),
      ).rejects.toThrowError('not supported is not supported');
    });
  });

  describe('fromMultipleTopics', () => {
    it('can get requests with payment network fromMultipleTopics', async () => {
      const mockDataAccessWithTxs: DataAccessTypes.IDataAccess = {
        async _getStatus(): Promise<any> {
          return;
        },
        async getChannelsByMultipleTopics(): Promise<any> {
          return {
            meta: {
              [TestData.actionRequestId]: [],
              [TestData.actionRequestIdSecondRequest]: [],
            },
            result: {
              transactions: {
                [TestData.actionRequestId]: [TestData.timestampedTransaction],
                [TestData.actionRequestIdSecondRequest]: [
                  TestData.timestampedTransactionSecondRequest,
                ],
              },
            },
          };
        },
        async getTransactionsByChannelId(channelId: string): Promise<any> {
          let transactions: any[] = [];
          if (channelId === TestData.actionRequestId) {
            transactions = [TestData.timestampedTransaction];
          }
          if (channelId === TestData.actionRequestIdSecondRequest) {
            transactions = [TestData.timestampedTransactionSecondRequest];
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
        async getChannelsByTopic(): Promise<any> {
          return;
        },
      };

      const requestnetwork = new RequestNetwork(mockDataAccessWithTxs);
      const requests: Request[] = await requestnetwork.fromMultipleTopics([
        TestData.payee.identity,
      ]);

      expect(requests.length).toBe(2);
      expect(requests[0].requestId).toBe(TestData.actionRequestId);
      expect(requests[1].requestId).toBe(TestData.actionRequestIdSecondRequest);
    });
  });
});
