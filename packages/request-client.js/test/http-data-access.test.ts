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
              'Timeout while confirming the Request was persisted. It is likely that the Request will be confirmed eventually. Catch this error and use getConfirmedTransaction() to continue polling for confirmation. Adjusting the httpConfig settings on the RequestNetwork object to avoid future timeouts. Avoid calling persistTransaction() again to prevent creating a duplicate Request.',
            );
            resolve();
          });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timed out')), 5000)),
      ]);
    });
  });
});
