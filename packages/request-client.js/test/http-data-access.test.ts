import HttpDataAccess from '../src/http-data-access';
import AxiosMockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

let mockAxios: MockAdapter;

beforeAll(() => {
  mockAxios = new AxiosMockAdapter(axios);
  mockAxios.onPost('/persistTransaction').reply(200, { result: {} });
  mockAxios.onGet('/getConfirmedTransaction').reply(200, { result: {} });
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
