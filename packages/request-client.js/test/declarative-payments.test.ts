import axios from 'axios';

import {
  ClientTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import { ethers } from 'ethers';

import AxiosMockAdapter from 'axios-mock-adapter';
import { RequestNetwork } from '../src/index';
import * as TestData from './data-test';

import {
  PaymentReferenceCalculator,
  getPaymentReference,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { IRequestDataWithEvents } from '../src/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { sign } from '@requestnetwork/utils';

const httpConfig: Partial<ClientTypes.IHttpDataAccessConfig> = {
  getConfirmationDeferDelay: 0,
};

const waitForConfirmation = async (
  dataOrPromise: IRequestDataWithEvents | Promise<IRequestDataWithEvents>,
): Promise<ClientTypes.IRequestDataWithEvents> => {
  const data = await dataOrPromise;
  return new Promise((resolve, reject) => {
    data.on('confirmed', resolve);
    data.on('error', reject);
  });
};

// Integration tests
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('request-client.js: declarative payments', () => {
  const requestCreationParams: ClientTypes.ICreateRequestParameters = {
    paymentNetwork: TestData.declarativePaymentNetworkNoPaymentInfo,
    requestInfo: TestData.parametersWithoutExtensionsData,
    signer: TestData.payee.identity,
  };
  let mock: AxiosMockAdapter;
  afterEach(() => {
    jest.clearAllMocks();
    mock.reset();
  });

  describe(`with simple creation`, () => {
    beforeEach(() => {
      mock = new AxiosMockAdapter(axios);

      const callback = (config: any): any => {
        expect(config.baseURL).toBe('http://localhost:3000');
        return [200, {}];
      };
      const spy = jest.fn(callback);
      mock.onPost('/persistTransaction').reply(spy);
      mock.onGet('/getTransactionsByChannelId').reply(200, {
        result: { transactions: [TestData.timestampedTransactionWithoutPaymentInfo] },
      });
      mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });
    });

    it('allows to declare a sent payment', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareSentPayment('10', 'sent payment', TestData.payer.identity),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to declare a received payment', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareReceivedPayment('10', 'received payment', TestData.payee.identity),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to create a request with delegate', async () => {
      const requestNetwork = new RequestNetwork({
        useMockStorage: true,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest({
        ...requestCreationParams,
        requestInfo: {
          ...TestData.parametersWithoutExtensionsData,
          extensionsData: [
            {
              action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
              id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
              parameters: {
                delegate: TestData.delegate.identity,
              },
            },
          ],
        },
      });
      await request.waitForConfirmation();

      const requestData = await waitForConfirmation(
        request.declareReceivedPayment('10', 'received payment', TestData.delegate.identity),
      );
      expect(requestData.balance!.balance).toEqual('10');
    });

    it('allows to declare a received payment by providing transaction hash and network', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareReceivedPayment(
          '10',
          'received payment',
          TestData.payee.identity,
          '0x123456789',
          'mainnet',
        ),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to declare a received payment from delegate', async () => {
      const requestNetwork = new RequestNetwork({
        useMockStorage: true,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      await waitForConfirmation(
        request.addDeclarativeDelegate(TestData.delegate.identity, TestData.payee.identity),
      );

      const requestData = await waitForConfirmation(
        request.declareReceivedPayment('10', 'received payment', TestData.delegate.identity),
      );
      expect(requestData.balance!.balance).toEqual('10');
    });

    it('allows to declare a sent refund', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareSentRefund('10', 'sent refund', TestData.payee.identity),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to declare a received refund', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareReceivedRefund('10', 'received refund', TestData.payer.identity),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to declare a received refund from delegate', async () => {
      const requestNetwork = new RequestNetwork({
        useMockStorage: true,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      await waitForConfirmation(
        request.addDeclarativeDelegate(TestData.delegate.identity, TestData.payer.identity),
      );

      const requestData = await waitForConfirmation(
        request.declareReceivedRefund('11', 'received refund', TestData.delegate.identity),
      );
      expect(requestData.balance!.balance).toEqual('-11');
    });

    it('allows to declare a received refund by providing transaction hash', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareReceivedRefund(
          '10',
          'received refund',
          TestData.payer.identity,
          '0x123456789',
        ),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to get the right balance', async () => {
      const requestParametersUSD: RequestLogicTypes.ICreateParameters = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        },
        expectedAmount: '100000000000',
        payee: TestData.payee.identity,
        payer: TestData.payer.identity,
      };

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: requestParametersUSD,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      await waitForConfirmation(
        request.declareSentPayment('1', 'sent payment', TestData.payer.identity),
      );

      await waitForConfirmation(
        request.declareReceivedRefund('10', 'received refund', TestData.payer.identity),
      );

      await waitForConfirmation(
        request.declareSentRefund('100', 'sent refund', TestData.payee.identity),
      );

      await waitForConfirmation(
        request.declareReceivedPayment('1000', 'received payment', TestData.payee.identity),
      );

      await waitForConfirmation(
        request.addPaymentInformation('payment info added', TestData.payee.identity),
      );
      await waitForConfirmation(
        request.addRefundInformation('refund info added', TestData.payer.identity),
      );

      const requestData = await request.refresh();

      expect(requestData.balance?.balance).toBe('990');
      expect(requestData.balance?.events[0].name).toBe('refund');
      expect(requestData.balance?.events[0].amount).toBe('10');
      expect(requestData.balance?.events[0].parameters).toMatchObject({ note: 'received refund' });

      expect(requestData.balance?.events[1].name).toBe('payment');
      expect(requestData.balance?.events[1].amount).toBe('1000');
      expect(requestData.balance?.events[1].parameters).toMatchObject({ note: 'received payment' });
    });

    it('can declare payments and refunds on an ANY_TO_ERC20_PROXY request', async () => {
      const salt = 'ea3bc7caf64110ca';
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
        currencies: [
          ...CurrencyManager.getDefaultList(),
          {
            type: RequestLogicTypes.CURRENCY.ERC20,
            address: '0x38cf23c52bb4b13f051aec09580a2de845a7fa35',
            decimals: 18,
            network: 'private', // private network forces RPC-based `getLogs`
            symbol: 'FAKE',
          },
        ],
      });

      // provider data is irrelevant in this test
      jest.spyOn(ethers.providers.BaseProvider.prototype, 'getLogs').mockResolvedValue([]);

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
          salt,
          feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
          feeAmount: '200',
          network: 'private',
          acceptedTokens: ['0x38cf23c52bb4b13f051aec09580a2de845a7fa35'],
          maxRateTimespan: 1000000,
        },
      };

      const requestInfo: ClientTypes.IRequestInfo = {
        expectedAmount: '100', // not used
        payee: TestData.payee.identity,
        payer: TestData.payer.identity,
        currency: 'USD',
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      await waitForConfirmation(
        request.declareSentPayment('10', 'sent payment', TestData.payer.identity),
      );

      await waitForConfirmation(
        request.declareSentRefund('2', 'sent refund', TestData.payee.identity),
      );

      await request.refresh();
      expect(request.getData().balance?.balance).toBe('0');

      await waitForConfirmation(
        request.declareReceivedPayment('10', 'received payment', TestData.payee.identity),
      );

      await waitForConfirmation(
        request.declareReceivedRefund('2', 'received refund', TestData.payer.identity),
      );

      await request.refresh();
      expect(request.getData().balance?.error).toBeUndefined();
      expect(request.getData().balance?.balance).toBe('8');
      expect(request.getData().balance?.events?.length).toBe(2);
    });
  });

  describe('other creations', () => {
    it('can have a payment reference on a declarative payment network', async () => {
      const salt = 'ea3bc7caf64110ca';
      mock = new AxiosMockAdapter(axios);
      const extensionParams = { salt, paymentInfo: { anyInfo: 'anyValue' } };

      const callback = (config: any): any => {
        expect(config.baseURL).toBe('http://localhost:3000');
        return [200, {}];
      };
      const spy = jest.fn(callback);
      mock.onPost('/persistTransaction').reply(spy);
      mock.onGet('/getTransactionsByChannelId').reply(200, {
        result: {
          transactions: [
            {
              ...TestData.timestampedTransactionWithoutPaymentInfo,
              transaction: {
                data: JSON.stringify({
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: TestData.arbitraryTimestamp,
                  transaction: {
                    data: JSON.stringify(
                      sign(
                        {
                          name: RequestLogicTypes.ACTION_NAME.CREATE,
                          parameters: {
                            ...TestData.parametersWithDeclarative,
                            extensionsData: [
                              {
                                action: 'create',
                                id: 'pn-any-declarative',
                                parameters: extensionParams,
                                version: '0.1.0',
                              },
                            ],
                          },
                          version: '2.0.3',
                        },
                        TestData.payee.signatureParams,
                      ),
                    ),
                  },
                }),
              },
            },
          ],
        },
      });
      mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

      const requestNetwork = new RequestNetwork({
        httpConfig,
        useMockStorage: true,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        ...requestCreationParams,
        paymentNetwork: {
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          parameters: extensionParams,
        },
      });
      await request.waitForConfirmation();

      const data = request.getData();
      console.debug(data);

      const pn = getPaymentNetworkExtension(data)!;

      const paymentReference = PaymentReferenceCalculator.calculate(
        data.requestId,
        pn.values.salt,
        JSON.stringify(pn.values.paymentInfo),
      );

      expect(paymentReference).toHaveLength(16);
      expect(paymentReference).toBe(getPaymentReference(data));
    });
  });
});
