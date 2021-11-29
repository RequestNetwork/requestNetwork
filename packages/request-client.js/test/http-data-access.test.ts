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
        returnPersistTransaction.on('error', (e) => {
          expect(e.message).toBe('Transaction confirmation not receive after 0 retries');
          done();
        });
      });
    });
  });
});
