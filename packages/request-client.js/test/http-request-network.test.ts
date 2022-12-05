import MockAdapter from 'axios-mock-adapter';
import * as TestData from './data-test';
import HttpRequestNetwork from '../src/http-request-network';

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
    const failAtCall = (call: number, skipPaymentInfo = false) => {
      let requestCount = 0;
      mockAxios.onGet('/getTransactionsByChannelId').reply(() => {
        requestCount++;
        return [
          requestCount >= call ? 500 : 200,
          {
            result: {
              transactions: [
                skipPaymentInfo
                  ? TestData.timestampedTransactionWithoutPaymentInfo
                  : TestData.timestampedTransaction,
              ],
            },
          },
        ];
      });
    };

    const createRequest = async (skipPaymentInfo = false) => {
      const requestNetwork = new HttpRequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
      });
      return await requestNetwork.createRequest({
        paymentNetwork: skipPaymentInfo
          ? TestData.declarativePaymentNetworkNoPaymentInfo
          : TestData.declarativePaymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
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

    it('accept', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.accept(TestData.payer.identity);
      await checkForError(request);
    }, 10000);

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

    it('add payment information', async () => {
      // Skipping payment information at creation and faked storage
      failAtCall(6, true);
      const request = await createRequest(true);
      await request.waitForConfirmation();
      await request.addPaymentInformation('payment info added', TestData.payee.identity);
      await checkForError(request);
    }, 10000);

    it('add refund information', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.addRefundInformation('refund info added', TestData.payer.identity);
      await checkForError(request);
    }, 10000);

    it('declare sent payment', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.declareSentPayment('10', 'sent payment', TestData.payer.identity);
      await checkForError(request);
    }, 10000);

    it('declare sent refund', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.declareSentRefund('10', 'sent refund', TestData.payee.identity);
      await checkForError(request);
    }, 10000);

    it('declare received payment', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.declareReceivedPayment('10', 'received payment', TestData.payee.identity);
      await checkForError(request);
    }, 10000);

    it('declare received refund', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.declareReceivedRefund('10', 'received refund', TestData.payer.identity);
      await checkForError(request);
    }, 10000);

    it('add declarative delegate', async () => {
      failAtCall(6);
      const request = await createRequest();
      await request.waitForConfirmation();
      await request.addDeclarativeDelegate(TestData.delegate.identity, TestData.payer.identity);
      await checkForError(request);
    }, 10000);
  });
});
