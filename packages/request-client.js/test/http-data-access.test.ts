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
      const returnPersistTransaction = await httpDataAccess.persistTransaction({}, '', []);
      await Promise.race([
        new Promise<void>((resolve) => {
          returnPersistTransaction.on('error', (e: any) => {
            expect(e.message).toBe(
              'The Request Network SDK timed-out while polling the Request Node to confirm that the Request was persisted successfully. It is likely that the persisted Request will be confirmed eventually. App Builders are discouraged from calling persistTransaction() a second time, which would create a duplicate Request. Instead, App Builders are recommended to catch this error and continue polling the Request Node using getConfirmedTransaction() or by calling the /getConfirmedTransaction endpoint.  To avoid timeouts in the future, try adjusting the httpConfig values when instantiating the RequestNetwork object. The current httpConfig settings are: getConfirmationDeferDelay: 0ms, getConfirmationMaxRetries: 0, getConfirmationRetryDelay: 1000ms, getConfirmationExponentialBackoffDelay: 0ms, getConfirmationMaxExponentialBackoffDelay: 30000ms',
            );
            resolve();
          });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timed out')), 5000)),
      ]);
    });
  });
});
