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
  mockServer.resetHandlers();
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
