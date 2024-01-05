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
          expect(e.message).toBe(
            `After calling /persistTransaction, polling /getConfirmedTransaction timed out. Try calling getConfirmedTransaction() until the transaction is confirmed. To avoid timeouts in the future, try adjusting the httpConfig values:
            getConfirmationDeferDelay: 0ms,
            getConfirmationMaxRetries: 0,
            getConfirmationRetryDelay: 1000ms,
            getConfirmationExponentialBackoffDelay: 0ms,
            getConfirmationMaxExponentialBackoffDelay: 30000ms`,
          );
          done();
        });
      });
    });
  });
});
