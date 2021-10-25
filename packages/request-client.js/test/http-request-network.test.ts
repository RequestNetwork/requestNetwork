import MockAdapter from 'axios-mock-adapter';
import * as TestData from './data-test';
import HttpRequestNetwork from '../src/http-request-network';
import * as Types from '../src/types';

let mockAxios: MockAdapter;

beforeAll(() => {
  mockAxios = TestData.mockAxiosRequestNode();
});

afterAll(() => {
  mockAxios.restore();
  jest.restoreAllMocks();
});

describe('HttpRequestNetwork', () => {
  describe('should emmit errors throwing on refresh after the confirmation happened', () => {
    const failAtCall = (
      call: number,
      data = TestData.timestampedTransactionWithoutExtensionsData,
    ) => {
      let requestCount = 0;
      mockAxios.onGet('/getTransactionsByChannelId').reply(() => {
        requestCount++;
        return [
          requestCount >= call ? 500 : 200,
          {
            result: { transactions: [data] },
          },
        ];
      });
    };

    const createRequest = async (overrideConfig: Partial<Types.ICreateRequestParameters> = {}) => {
      const requestNetwork = new HttpRequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
      });
      return await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
        ...overrideConfig,
      });
    };

    const checkForError = async (eventEmitter: { on: any }) => {
      const error: Error = await new Promise((r) => {
        eventEmitter.on('error', (e: any) => {
          r(e);
        });
      });
      expect(error.message).toBe('Request failed with status code 500');
    };

    it('create', async () => {
      failAtCall(2);
      const request = await createRequest();
      await checkForError(request);
    });

    it('cancel', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.cancel(TestData.payee.identity);
      await checkForError(request);
    }, 10000);

    it('increase the expected amount', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.increaseExpectedAmountRequest(3, TestData.payer.identity);
      await checkForError(request);
    }, 10000);

    it('reduce the expected amount', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.reduceExpectedAmountRequest(3, TestData.payee.identity);
      await checkForError(request);
    }, 10000);

    it('declare a sent payment', async () => {
      failAtCall(6, TestData.timestampedTransactionWithDeclarative);
      const request = await createRequest({ paymentNetwork: TestData.declarativePaymentNetwork });
      await request.waitForConfirmation();
      await request.declareSentPayment('10', 'sent payment', TestData.payer.identity);
      await checkForError(request);
    }, 10000);

    it('declare a received payment', async () => {
      failAtCall(6, TestData.timestampedTransactionWithDeclarative);
      const request = await createRequest({ paymentNetwork: TestData.declarativePaymentNetwork });
      await request.waitForConfirmation();
      await request.declareReceivedPayment('10', 'received payment', TestData.payee.identity);
      await checkForError(request);
    }, 10000);
  });
});
