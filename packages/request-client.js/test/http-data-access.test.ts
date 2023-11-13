import HttpDataAccess from '../src/http-data-access';
import * as TestData from './data-test';
import { SetupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

let mockServer: SetupServer;

beforeAll(() => {
  mockServer = TestData.mockRequestNode();
});

afterAll(() => {
  mockServer.close();
  jest.restoreAllMocks();
});

describe('HttpDataAccess', () => {
  describe('persistTransaction()', () => {
    it('should emit error', async () => {
      mockServer.use(
        http.get('*/getConfirmedTransaction', () =>
          HttpResponse.json({ result: {} }, { status: 404 }),
        ),
      );
      const httpDataAccess = new HttpDataAccess({
        httpConfig: {
          getConfirmationDeferDelay: 0,
          getConfirmationMaxRetry: 0,
        },
      });
      await expect(
        new Promise((resolve, reject) =>
          httpDataAccess.persistTransaction({}, '', []).then((returnPersistTransaction) => {
            returnPersistTransaction.on('confirmed', resolve);
            returnPersistTransaction.on('error', reject);
          }),
        ),
      ).rejects.toThrow(
        new Error(`Transaction confirmation not received. Try polling
          getTransactionsByChannelId() until the transaction is confirmed.
          deferDelay: 0ms,
          maxRetries: 0,
          retryDelay: 1000ms,
          exponentialBackoffDelay: 0ms,
          maxExponentialBackoffDelay: 30000ms`),
      );
    });
  });
});
