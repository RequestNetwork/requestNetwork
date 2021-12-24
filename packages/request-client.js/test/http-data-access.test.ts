import HttpDataAccess from '../src/http-data-access';
import MockAdapter from 'axios-mock-adapter';
import * as TestData from './data-test';

let mockAxios: MockAdapter;

beforeEach(() => {
  mockAxios = TestData.mockAxiosRequestNode();
});

afterEach(() => {
  mockAxios.restore();
  jest.restoreAllMocks();
});

describe('HttpDataAccess', () => {
  describe('persistTransaction()', () => {
    it('should throw error for persistTransaction failure', (done) => {
      mockAxios.onPost('/persistTransaction').reply(500, { result: {} });
      const httpDataAccess = new HttpDataAccess();
      void httpDataAccess.persistTransaction({}, '', []).catch((e) => {
        expect(e.message).toBe('Request failed with status code 500');
        done();
      });
    });
    it('should emmit error for getConfirmedTransaction failure', (done) => {
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
