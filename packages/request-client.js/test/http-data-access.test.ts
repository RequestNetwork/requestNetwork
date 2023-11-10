import HttpDataAccess from '../src/http-data-access';
import MockAdapter from 'axios-mock-adapter';
import * as TestData from './data-test';

let mockAxios: MockAdapter;

beforeAll(() => {
  mockAxios = TestData.mockAxiosRequestNode();
});

afterAll(() => {
  mockAxios.restore();
  jest.restoreAllMocks();
});

describe('HttpDataAccess', () => {
  describe('persistTransaction()', () => {
    it('should emmit error', (done) => {
      mockAxios.onGet('/getConfirmedTransaction').reply(404, { result: {} });
      const httpDataAccess = new HttpDataAccess({
        httpConfig: {
          getConfirmationDeferDelay: 0,
          getConfirmationMaxRetry: 0,
        },
      });
      void httpDataAccess.persistTransaction({}, '', []).then((returnPersistTransaction) => {
        returnPersistTransaction.on('error', (e: any) => {
          expect(e.message).toBe(`Transaction confirmation not received. Try polling
            getTransactionsByChannelId() until the transaction is confirmed.
            deferDelay: 0ms,
            maxRetries: 0,
            retryDelay: 1000ms,
            exponentialBackoffDelay: 0ms,
            maxExponentialBackoffDelay: 30000ms`);
          done();
        });
      });
    });
  });
});
