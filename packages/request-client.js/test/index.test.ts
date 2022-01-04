import axios from 'axios';

import {
  ClientTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ethers } from 'ethers';

import AxiosMockAdapter from 'axios-mock-adapter';
import { Request, RequestNetwork } from '../src/index';
import * as TestData from './data-test';
import * as TestDataRealBTC from './data-test-real-btc';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import { BigNumber } from 'ethers';
import EtherscanProviderMock from './etherscan-mock';
import httpConfigDefaults from '../src/http-config-defaults';
import { IRequestDataWithEvents } from '../src/types';
import { CurrencyManager } from '@requestnetwork/currency';

const packageJson = require('../package.json');

const httpConfig: Partial<ClientTypes.IHttpDataAccessConfig> = {
  getConfirmationDeferDelay: 0,
};

const encryptionData = {
  decryptionParams: {
    key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  },
};

const fakeDecryptionProvider: DecryptionProviderTypes.IDecryptionProvider = {
  decrypt: (
    data: EncryptionTypes.IEncryptedData,
    identity: IdentityTypes.IIdentity,
  ): Promise<string> => {
    switch (identity.value.toLowerCase()) {
      case encryptionData.identity.value:
        return Utils.encryption.decrypt(data, encryptionData.decryptionParams);

      default:
        throw new Error('Identity not registered');
    }
  },
  isIdentityRegistered: async (identity: IdentityTypes.IIdentity): Promise<boolean> => {
    return [encryptionData.identity.value].includes(identity.value.toLowerCase());
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [EncryptionTypes.METHOD.ECIES],
};

const requestParameters: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'mainnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  payee: TestData.payee.identity,
  payer: TestData.payer.identity,
  timestamp: 1549956270,
};

const mockBTCProvider = {
  getAddressBalanceWithEvents: (): Promise<
    PaymentTypes.IBalanceWithEvents<PaymentTypes.IBTCPaymentEventParameters>
  > => {
    return Promise.resolve({
      balance: '666743',
      events: [
        {
          amount: '666743',
          name: PaymentTypes.EVENTS_NAMES.PAYMENT,
          parameters: {
            block: 561874,
            txHash: '4024936746a0994cf5cdf9c8b55e03b288a251ad172682e8e94b7806a4e3dace',
          },
        },
      ],
    });
  },
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
describe('index', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('specify the Request Client version in the header', async () => {
    const mock = new AxiosMockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.headers[httpConfigDefaults.requestClientVersionHeader]).toBe(
        packageJson.version,
      );
      return [200, {}];
    };
    const spy = jest.fn(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.timestampedTransaction] } });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
      parameters: {},
    };
    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await request.waitForConfirmation();
  });

  it('uses http://localhost:3000 with signatureProvider and paymentNetwork', async () => {
    const mock = new AxiosMockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).toBe('http://localhost:3000');
      return [200, {}];
    };
    const spy = jest.fn(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.timestampedTransaction] } });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
      parameters: {},
    };
    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await request.waitForConfirmation();
  });

  it('uses http://localhost:3000 with persist from local', async () => {
    const mock = new AxiosMockAdapter(axios);
    const callback = (): any => {
      return [200, { ipfsSize: 100, ipfsHash: 'QmZLqH4EsjmB79gjvyzXWBcihbNBZkw8YuELco84PxGzQY' }];
    };
    // const spyPersistTransaction = jest.fn();
    const spyIpfsAdd = jest.fn(callback);
    // mock.onPost('/persistTransaction').reply(spyPersistTransaction);
    mock.onPost('/persistTransaction').reply(200, { meta: {}, result: {} });
    mock.onPost('/ipfsAdd').reply(spyIpfsAdd);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      meta: { storageMeta: [], transactionsStorageLocation: [] },
      result: { transactions: [] },
    });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      ethereumProviderUrl: 'http://localhost:8545',
      signatureProvider: TestData.fakeSignatureProvider,
      useLocalEthereumBroadcast: true,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    expect(spyIpfsAdd).toHaveBeenCalledTimes(1);

    await request.waitForConfirmation();
  });

  it('uses http://localhost:3000 with signatureProvider and paymentNetwork real btc', async () => {
    const mock = new AxiosMockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).toBe('http://localhost:3000');
      return [200, {}];
    };
    const spy = jest.fn(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestDataRealBTC.timestampedTransaction] },
    });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: requestParameters,
      signer: TestData.payee.identity,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await request.waitForConfirmation();
  });

  it('uses http://localhost:3000 with signatureProvider', async () => {
    const mock = new AxiosMockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).toBe('http://localhost:3000');
      return [200, {}];
    };
    const spy = jest.fn(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('uses baseUrl given in parameter', async () => {
    const baseURL = 'http://request.network/api';
    const mock = new AxiosMockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).toBe(baseURL);
      return [200, {}];
    };
    const spy = jest.fn(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      nodeConnectionConfig: { baseURL },
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await request.waitForConfirmation();
  });

  it('allows to create a request', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();
    expect(mock.history.get).toHaveLength(3);
    expect(mock.history.post).toHaveLength(1);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(request.requestId.length).toBe(requestIdLength);
  });

  it('allows to compute a request id', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    mock.resetHistory();

    const requestId = await requestNetwork.computeRequestId({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    expect(mock.history.get).toHaveLength(0);
    expect(mock.history.post).toHaveLength(0);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(requestId.length).toBe(requestIdLength);
  });

  it('allows to compute a request id, then generate the request with the same id', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const requestId = await requestNetwork.computeRequestId({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(requestId.length).toBe(requestIdLength);

    await new Promise((resolve): any => setTimeout(resolve, 150));
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBe(requestId);
    expect(mock.history.get).toHaveLength(3);
    expect(mock.history.post).toHaveLength(1);
  });

  it('allows to get a request from its ID', async () => {
    TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    const requestFromId = await requestNetwork.fromRequestId(request.requestId);

    expect(requestFromId.requestId).toBe(request.requestId);
  });

  it('allows to get a request from its ID with a payment network', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
      parameters: {},
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    const requestFromId = await requestNetwork.fromRequestId(request.requestId);

    expect(requestFromId.getData()).toMatchObject({
      requestId: request.requestId,
      currency: 'BTC-testnet-testnet',
      currencyInfo: {
        network: 'testnet',
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      },
      balance: {
        balance: '0',
        events: [],
      },
    });
  });

  it('allows to refresh a request', async () => {
    const mock = new AxiosMockAdapter(axios);
    mock.onPost('/persistTransaction').reply(200, { result: {} });
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });
    mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });

    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    mock.resetHistory();

    const data = await request.refresh();

    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.post).toHaveLength(0);
  });

  it('works with mocked storage', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.PENDING);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.CREATED);

    const dataConfirmed = await request.waitForConfirmation();
    expect(dataConfirmed.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(dataConfirmed.pending).toBeNull();
  });

  it('works with mocked storage emitting error when append', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    // ask mock up storage to emit error next append call()
    requestNetwork._mockStorage!._makeNextAppendFailInsteadOfConfirmed();

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.PENDING);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.CREATED);

    const errorEmitted: string = await new Promise((resolve): any => request.on('error', resolve));
    expect(errorEmitted).toBe('forced error asked by _makeNextAppendFailInsteadOfConfirmed()');

    expect(() => request.getData()).toThrow('request confirmation failed');
    await expect(request.refresh()).rejects.toThrowError('request confirmation failed');
  });

  it('works with mocked storage emitting error when append waitForConfirmation will throw', async () => {
    const requestNetworkInside = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    // ask mock up storage to emit error next append call()
    requestNetworkInside._mockStorage!._makeNextAppendFailInsteadOfConfirmed();

    const request = await requestNetworkInside.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.PENDING);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.CREATED);

    await expect(request.waitForConfirmation()).rejects.toBe(
      'forced error asked by _makeNextAppendFailInsteadOfConfirmed()',
    );

    expect(() => request.getData()).toThrowError('request confirmation failed');
    await expect(request.refresh()).rejects.toThrowError('request confirmation failed');
  });

  it('creates a request with error event', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.PENDING);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.CREATED);

    const dataConfirmed = await request.waitForConfirmation();
    expect(dataConfirmed.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(dataConfirmed.pending).toBeNull();
  });

  it('works with mocked storage and mocked payment network', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.PENDING);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.CREATED);

    const dataConfirmed = await request.waitForConfirmation();
    expect(dataConfirmed.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(dataConfirmed.pending).toBeNull();
    expect(dataConfirmed.balance?.balance).toBe('666743');
    expect(dataConfirmed.balance?.events.length).toBe(1);
  });

  it('works with mocked storage and content data', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const contentData = {
      invoice: true,
      what: 'ever',
    };

    const request = await requestNetwork.createRequest({
      contentData,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });

    const data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();

    await request.waitForConfirmation();
  });

  it('allows to accept a request', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    mock.resetHistory();

    const requestDataWithEvents = await request.accept(TestData.payer.identity);
    await waitForConfirmation(requestDataWithEvents);

    expect(mock.history.get).toHaveLength(5);
    expect(mock.history.post).toHaveLength(1);
  });

  it('works with mocked storage emitting error when append an accept', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    // ask mock up storage to emit error next append call()
    requestNetwork._mockStorage!._makeNextAppendFailInsteadOfConfirmed();
    await request.accept(TestData.payer.identity);

    let data = request.getData();
    expect(data).toBeDefined();
    expect(data.balance).toBeNull();
    expect(data.meta).toBeDefined();
    expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
    expect(data.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.ACCEPTED);

    const errorEmitted: string = await new Promise((resolve): any => request.on('error', resolve));
    expect(errorEmitted).toBe('forced error asked by _makeNextAppendFailInsteadOfConfirmed()');

    data = request.getData();
    expect(data.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.ACCEPTED);

    // TODO: For now data will be pending forever.
    // Ethereum-storage should treat the errors and clean up.
    data = await request.refresh();
    expect(data.state).toBe(RequestLogicTypes.STATE.CREATED);
    expect(data.pending?.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
  });

  it('allows to cancel a request', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    mock.resetHistory();

    await waitForConfirmation(request.cancel(TestData.payee.identity));

    expect(mock.history.get).toHaveLength(5);
    expect(mock.history.post).toHaveLength(1);
  });

  it('allows to increase the expected amount a request', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    mock.resetHistory();

    await waitForConfirmation(request.increaseExpectedAmountRequest(3, TestData.payer.identity));

    expect(mock.history.get).toHaveLength(5);
    expect(mock.history.post).toHaveLength(1);
  });

  it('allows to reduce the expected amount a request', async () => {
    const mock = TestData.mockAxiosRequestNode();
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider: TestData.fakeSignatureProvider,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    });
    await request.waitForConfirmation();

    mock.resetHistory();

    await waitForConfirmation(request.reduceExpectedAmountRequest(3, TestData.payee.identity));

    expect(mock.history.get).toHaveLength(5);
    expect(mock.history.post).toHaveLength(1);
  });

  describe('tests with declarative payments', () => {
    let mock: AxiosMockAdapter;
    afterEach(() => {
      jest.clearAllMocks();
      mock.reset();
    });
    beforeEach(() => {
      mock = new AxiosMockAdapter(axios);

      const callback = (config: any): any => {
        expect(config.baseURL).toBe('http://localhost:3000');
        return [200, {}];
      };
      const spy = jest.fn(callback);
      mock.onPost('/persistTransaction').reply(spy);
      mock.onGet('/getTransactionsByChannelId').reply(200, {
        result: { transactions: [TestData.timestampedTransactionWithDeclarative] },
      });
      mock.onGet('/getConfirmedTransaction').reply(200, { result: {} });
    });

    it('allows to declare a sent payment', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      mock.resetHistory();

      await waitForConfirmation(
        request.declareReceivedPayment('10', 'received payment', TestData.payee.identity),
      );

      expect(mock.history.get).toHaveLength(5);
      expect(mock.history.post).toHaveLength(1);
    });

    it('allows to declare a received payment from delegate', async () => {
      const requestNetwork = new RequestNetwork({
        useMockStorage: true,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      await waitForConfirmation(
        request.addDeclarativeDelegate(TestData.delegate.identity, TestData.payee.identity),
      );

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

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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

    it('allows to declare a sent refund', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
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
      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
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
  });

  it('can declare payments and refunds on an ANY_TO_ERC20_PROXY request', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
      currencies: [
        ...CurrencyManager.getDefaultList(),
        {
          type: RequestLogicTypes.CURRENCY.ERC20,
          address: '0x38cf23c52bb4b13f051aec09580a2de845a7fa35',
          decimals: 18,
          network: 'private',
          symbol: 'FAKE',
        },
      ],
    });

    // provider data is irrelevant in this test
    jest.spyOn(ethers.providers.BaseProvider.prototype, 'getLogs').mockResolvedValue([]);

    const salt = 'ea3bc7caf64110ca';

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
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

    const requestInfo = {
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

  describe('tests with encryption', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('creates and reads an encrypted request', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [encryptionData.encryptionParams],
      );

      const requestFromId = await requestNetwork.fromRequestId(request.requestId);

      expect(requestFromId).toMatchObject(request);

      const requestData = requestFromId.getData();
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
    });

    it('cannot create an encrypted request without encryption parameters', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      await expect(
        requestNetwork._createEncryptedRequest(
          {
            requestInfo: TestData.parametersWithoutExtensionsData,
            signer: TestData.payee.identity,
          },
          [],
        ),
      ).rejects.toThrowError(
        'You must give at least one encryption parameter to create an encrypted request',
      );
    });

    it('creates an encrypted request and recovers it by topic', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
          topics: ['my amazing test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestsFromTopic = await requestNetwork.fromTopic('my amazing test topic');
      expect(requestsFromTopic).not.toHaveLength(0);
      expect(requestsFromTopic[0]).toMatchObject(request);

      const requestData = requestsFromTopic[0].getData();
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
    });

    it('creates multiple encrypted requests and recovers it by multiple topic', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
          topics: ['my amazing test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const request2 = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: {
            ...TestData.parametersWithoutExtensionsData,
            timestamp: (TestData.parametersWithoutExtensionsData.timestamp || 1) + 1,
          },
          signer: TestData.payee.identity,
          topics: ['my second best test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestsFromTopic = await requestNetwork.fromMultipleTopics([
        'my amazing test topic',
        'my second best test topic',
      ]);
      expect(requestsFromTopic).toHaveLength(2);
      expect(requestsFromTopic[0]).toMatchObject(request);
      expect(requestsFromTopic[1]).toMatchObject(request2);

      requestsFromTopic.forEach((req) => {
        const requestData = req.getData();
        expect(requestData.meta).not.toBeNull();
        expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
      });
    }, 10000);

    it('creates an encrypted request and recovers it by identity', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
          topics: ['my amazing test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestFromIdentity = await requestNetwork.fromIdentity(TestData.payee.identity);
      expect(requestFromIdentity).not.toBe('');
      expect(requestFromIdentity[0]).toMatchObject(request);

      const requestData = requestFromIdentity[0].getData();
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
    });

    it('creates an encrypted request and accept it', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [encryptionData.encryptionParams],
      );
      await request.waitForConfirmation();

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);

      const requestData = fetchedRequest.getData();
      expect(requestData).toMatchObject(request.getData());
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

      const acceptResult = await fetchedRequest.accept(TestData.payer.identity);
      expect(acceptResult.state).toBe(RequestLogicTypes.STATE.CREATED);
      expect(acceptResult.pending?.state).toBe(RequestLogicTypes.STATE.ACCEPTED);

      const dataConfirmed = await waitForConfirmation(acceptResult);
      expect(dataConfirmed.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
      expect(dataConfirmed.pending).toBeNull();
    });

    it('creates an encrypted request and cancel it', async () => {
      jest.useFakeTimers('modern');
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);

      expect(fetchedRequest).toMatchObject(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

      jest.advanceTimersByTime(150);
      await fetchedRequest.cancel(TestData.payee.identity);
      jest.advanceTimersByTime(150);
      expect((await fetchedRequest.refresh()).state).toBe(RequestLogicTypes.STATE.CANCELED);
      jest.useRealTimers();
    });

    it('creates an encrypted request, increase and decrease the amount', async () => {
      jest.useFakeTimers('modern');
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      expect(fetchedRequest).toMatchObject(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

      jest.advanceTimersByTime(150);
      await fetchedRequest.increaseExpectedAmountRequest(
        TestData.parametersWithoutExtensionsData.expectedAmount,
        TestData.payer.identity,
      );

      jest.advanceTimersByTime(150);
      expect((await fetchedRequest.refresh()).expectedAmount).toBe(
        String(BigNumber.from(TestData.parametersWithoutExtensionsData.expectedAmount).mul(2)),
      );

      await fetchedRequest.reduceExpectedAmountRequest(
        BigNumber.from(TestData.parametersWithoutExtensionsData.expectedAmount).mul(2).toString(),
        TestData.payee.identity,
      );

      jest.advanceTimersByTime(150);
      expect((await fetchedRequest.refresh()).expectedAmount).toBe('0');
      jest.useRealTimers();
    });

    it('creates an encrypted declarative request, accepts it and declares a payment on it', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          paymentNetwork: TestData.declarativePaymentNetwork,
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      const requestData = fetchedRequest.getData();
      expect(requestData).toMatchObject(request.getData());
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

      const dataConfirmed = await waitForConfirmation(
        fetchedRequest.accept(TestData.payer.identity),
      );

      expect(dataConfirmed.state).toBe(RequestLogicTypes.STATE.ACCEPTED);

      const declareSentPaymentResult = await waitForConfirmation(
        fetchedRequest.declareSentPayment(
          TestData.parametersWithoutExtensionsData.expectedAmount,
          'PAID',
          TestData.payer.identity,
        ),
      );

      expect(declareSentPaymentResult.balance!.balance).toBe('0');

      const declareReceivedPaymentResult = await waitForConfirmation(
        fetchedRequest.declareReceivedPayment(
          TestData.parametersWithoutExtensionsData.expectedAmount as string,
          'payment received',
          TestData.payee.identity,
        ),
      );

      expect(declareReceivedPaymentResult.balance!.balance).toBe(
        TestData.parametersWithoutExtensionsData.expectedAmount,
      );
    });
  });

  describe('ETH requests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('can create ETH requests with given salt', async () => {
      jest.useFakeTimers('modern');

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const salt = 'ea3bc7caf64110ca';

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          salt,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        disablePaymentDetection: true,
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      expect(data).toBeDefined();
      expect(data.balance).toBeDefined();
      expect(data.meta).toBeDefined();
      expect(data.currency).toBe('ETH-rinkeby-rinkeby');
      expect(data.extensionsData[0].parameters.salt).toBe(salt);
      expect(data.expectedAmount).toBe(requestParameters.expectedAmount);
      jest.useRealTimers();
    });

    it('can create ETH requests without given salt', async () => {
      jest.useFakeTimers('modern');

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        disablePaymentDetection: true,
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).toBe(16);
      jest.useRealTimers();
    });

    it('can create ETH requests without refund address', async () => {
      jest.useFakeTimers('modern');

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        disablePaymentDetection: true,
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).toBe(16);
      jest.useRealTimers();
    });

    // This test checks that 2 payments with reference `c19da4923539c37f` have reached 0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB
    it('can get the balance of an ETH request', async () => {
      jest.useFakeTimers('modern');
      const etherscanMock = new EtherscanProviderMock();
      ethers.providers.EtherscanProvider.prototype.getHistory = jest
        .fn()
        .mockImplementation(etherscanMock.getHistory);
      ethers.providers.EtherscanProvider.prototype.getNetwork = jest
        .fn()
        .mockImplementation(etherscanMock.getNetwork);

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'a1a2a3a4a5a6a7a8',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      // Payment reference should be fixed
      expect(
        PaymentReferenceCalculator.calculate(
          data.requestId,
          data.extensionsData[0].parameters.salt,
          data.extensionsData[0].parameters.paymentAddress,
        ),
      ).toBe('c19da4923539c37f');

      jest.advanceTimersByTime(150);
      const dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12345600000');
      expect(dataAfterRefresh.balance?.events.length).toBe(2);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      expect(dataAfterRefresh.balance?.events[1].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[1].amount).toBe('45600000');
      expect(dataAfterRefresh.balance?.events[1].parameters!.txHash).toBe(
        '0x38c44820c37d31fbfe3fcee9d4bcf1b887d3f90fb67d62d924af03b065a80ced',
      );
      jest.useRealTimers();
    });

    it('can disable and enable the get the balance of a request', async () => {
      jest.useFakeTimers('modern');

      const etherscanMock = new EtherscanProviderMock();
      ethers.providers.EtherscanProvider.prototype.getHistory = jest
        .fn()
        .mockImplementation(etherscanMock.getHistory);
      ethers.providers.EtherscanProvider.prototype.getNetwork = jest
        .fn()
        .mockImplementation(etherscanMock.getNetwork);

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'a1a2a3a4a5a6a7a8',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        disablePaymentDetection: true,
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      // Payment reference should be fixed
      expect(
        PaymentReferenceCalculator.calculate(
          data.requestId,
          data.extensionsData[0].parameters.salt,
          data.extensionsData[0].parameters.paymentAddress,
        ),
      ).toBe('c19da4923539c37f');

      jest.advanceTimersByTime(150);
      let dataAfterRefresh = await request.refresh();
      expect(dataAfterRefresh.balance).toBeNull();

      request.enablePaymentDetection();
      jest.advanceTimersByTime(150);
      dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12345600000');
      expect(dataAfterRefresh.balance?.events.length).toBe(2);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      expect(dataAfterRefresh.balance?.events[1].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[1].amount).toBe('45600000');
      expect(dataAfterRefresh.balance?.events[1].parameters!.txHash).toBe(
        '0x38c44820c37d31fbfe3fcee9d4bcf1b887d3f90fb67d62d924af03b065a80ced',
      );

      request.disablePaymentDetection();
      jest.advanceTimersByTime(150);
      dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12345600000');
      expect(dataAfterRefresh.balance?.events.length).toBe(2);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      expect(dataAfterRefresh.balance?.events[1].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[1].amount).toBe('45600000');
      expect(dataAfterRefresh.balance?.events[1].parameters!.txHash).toBe(
        '0x38c44820c37d31fbfe3fcee9d4bcf1b887d3f90fb67d62d924af03b065a80ced',
      );
      jest.useRealTimers();
    });

    it('can get the balance on a skipped payment detection request', async () => {
      jest.useFakeTimers('modern');

      const etherscanMock = new EtherscanProviderMock();
      ethers.providers.EtherscanProvider.prototype.getHistory = jest
        .fn()
        .mockImplementation(etherscanMock.getHistory);
      ethers.providers.EtherscanProvider.prototype.getNetwork = jest
        .fn()
        .mockImplementation(etherscanMock.getNetwork);

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'a1a2a3a4a5a6a7a8',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
      });

      const request = await requestNetwork.createRequest({
        disablePaymentDetection: true,
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      jest.advanceTimersByTime(150);
      const data = await request.refresh();

      // Payment reference should be fixed
      expect(
        PaymentReferenceCalculator.calculate(
          data.requestId,
          data.extensionsData[0].parameters.salt,
          data.extensionsData[0].parameters.paymentAddress,
        ),
      ).toBe('c19da4923539c37f');

      jest.advanceTimersByTime(150);
      let dataAfterRefresh = await request.refresh();
      expect(dataAfterRefresh.balance).toBeNull();

      const balance = await request.refreshBalance();
      expect(balance?.balance).toBe('12345600000');
      expect(balance?.events.length).toBe(2);

      expect(balance?.events[0].name).toBe('payment');
      expect(balance?.events[0].amount).toBe('12300000000');
      expect(balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      expect(balance?.events[1].name).toBe('payment');
      expect(balance?.events[1].amount).toBe('45600000');
      expect(balance?.events[1].parameters!.txHash).toBe(
        '0x38c44820c37d31fbfe3fcee9d4bcf1b887d3f90fb67d62d924af03b065a80ced',
      );
      dataAfterRefresh = request.getData();

      expect(dataAfterRefresh.balance?.balance).toBe('12345600000');
      expect(dataAfterRefresh.balance?.events.length).toBe(2);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      expect(dataAfterRefresh.balance?.events[1].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[1].amount).toBe('45600000');
      expect(dataAfterRefresh.balance?.events[1].parameters!.txHash).toBe(
        '0x38c44820c37d31fbfe3fcee9d4bcf1b887d3f90fb67d62d924af03b065a80ced',
      );

      jest.useRealTimers();
    });
  });

  describe('ERC20 address based requests', () => {
    it('can create ERC20 address based requests', async () => {
      const testErc20TokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      // generate address randomly to avoid collisions
      const paymentAddress =
        '0x' + (await Utils.crypto.CryptoWrapper.random32Bytes()).slice(12).toString('hex');
      const refundAddress =
        '0x' + (await Utils.crypto.CryptoWrapper.random32Bytes()).slice(12).toString('hex');

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
        parameters: {
          paymentAddress,
          refundAddress,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: testErc20TokenAddress,
        },
      });

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      await new Promise((resolve): any => setTimeout(resolve, 150));
      let data = await request.refresh();

      expect(data).toBeDefined();
      expect(data.balance?.balance).toBe('0');
      expect(data.balance?.events.length).toBe(0);
      expect(data.meta).toBeDefined();
      expect(data.currency).toBe('unknown');

      expect(
        data.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values.paymentAddress,
      ).toBe(paymentAddress);
      expect(
        data.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values.refundAddress,
      ).toBe(refundAddress);
      expect(data.expectedAmount).toBe(requestParameters.expectedAmount);

      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      const erc20abiFragment = [
        'function transfer(address _to, uint _value) returns (bool transfer)',
      ];

      // Setup the ERC20 contract interface
      const contract = new ethers.Contract(
        testErc20TokenAddress,
        erc20abiFragment,
        provider.getSigner(0),
      );
      // check payment
      await contract.transfer(paymentAddress, 2);

      data = await request.refresh();
      expect(data.balance?.balance).toBe('2');
      expect(data.balance?.events.length).toBe(1);
      expect(data.balance?.events[0].amount).toBe('2');
      expect(data.balance?.events[0].name).toBe('payment');
      expect(data.balance?.events[0].timestamp).toBeDefined();
      expect(data.balance?.events[0].parameters.block).toBeDefined();
      expect(data.balance?.events[0].parameters.from.length).toBe(42);
      expect(data.balance?.events[0].parameters.to.toLowerCase()).toBe(paymentAddress);
      expect(data.balance?.events[0].parameters.txHash.length).toBe(66);

      // check refund
      await contract.transfer(refundAddress, 1);

      data = await request.refresh();
      expect(data.balance?.balance).toBe('1');
      expect(data.balance?.events.length).toBe(2);
      expect(data.balance?.events[0].amount).toBe('2');
      expect(data.balance?.events[0].name).toBe('payment');
      expect(data.balance?.events[0].timestamp).toBeDefined();
      expect(data.balance?.events[0].parameters.block).toBeDefined();
      expect(data.balance?.events[0].parameters.from.length).toBe(42);
      expect(data.balance?.events[0].parameters.to.toLowerCase()).toBe(paymentAddress);
      expect(data.balance?.events[0].parameters.txHash.length).toBe(66);
      expect(data.balance?.events[1].amount).toBe('1');
      expect(data.balance?.events[1].name).toBe('refund');
      expect(data.balance?.events[1].timestamp).toBeDefined();
      expect(data.balance?.events[1].parameters.block).toBeDefined();
      expect(data.balance?.events[1].parameters.from.length).toBe(42);
      expect(data.balance?.events[1].parameters.to.toLowerCase()).toBe(refundAddress);
      expect(data.balance?.events[1].parameters.txHash.length).toBe(66);
    });
  });

  describe('ERC20 proxy contract requests', () => {
    it('can create ERC20 requests with given salt', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const salt = 'ea3bc7caf64110ca';

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc',
          refundAddress: '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
          salt,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // Test Erc20
        },
      });

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
        disablePaymentDetection: true,
      });
      const data = await request.waitForConfirmation();

      expect(data).toBeDefined();
      expect(data.balance?.error).toBeUndefined();
      expect(data.balance?.balance).toBeUndefined();
      expect(data.meta).toBeDefined();
      expect(data.currency).toBe('unknown');
      expect(data.extensionsData[0].parameters.salt).toBe(salt);
      expect(data.expectedAmount).toBe(requestParameters.expectedAmount);
    });

    it('can create ERC20 requests without given salt', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          refundAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
        currency: {
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40',
        },
      });

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      });

      await new Promise((resolve): any => setTimeout(resolve, 150));
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).toBe(16);
    });
  });

  describe('Token lists', () => {
    const testErc20Data = {
      ...TestData.parametersWithoutExtensionsData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // Test Erc20
      },
    };
    const daiData = {
      ...TestData.parametersWithoutExtensionsData,
      currency: {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      },
    };
    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      parameters: {
        paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        refundAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
      },
    };

    it('supports a default list when nothing is provided', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: daiData,
        paymentNetwork,
        signer: TestData.payee.identity,
      });

      expect(request.getData().currency).toBe('DAI-mainnet');
    });

    it('shows unknown when the currency is not known', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: testErc20Data,
        paymentNetwork,
        signer: TestData.payee.identity,
      });

      expect(request.getData().currency).toBe('unknown');
    });

    describe('allows overriding the default currencies', () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
        currencies: [
          {
            network: 'private',
            address: testErc20Data.currency.value,
            type: RequestLogicTypes.CURRENCY.ERC20,
            decimals: 18,
            symbol: '_TEST',
          },
        ],
      });

      it('allows creating a request by currency properties', async () => {
        const request = await requestNetwork.createRequest({
          requestInfo: testErc20Data,
          paymentNetwork,
          signer: TestData.payee.identity,
        });

        expect(request.getData().currency).toBe('_TEST-private');
      });

      it('allows creating a request by currency name', async () => {
        const request = await requestNetwork.createRequest({
          requestInfo: {
            ...testErc20Data,
            currency: '_TEST',
          },
          paymentNetwork,
          signer: TestData.payee.identity,
        });

        expect(request.getData().currency).toBe('_TEST-private');
      });

      it('overrides the default token list', async () => {
        const daiRequest = await requestNetwork.createRequest({
          requestInfo: daiData,
          paymentNetwork,
          signer: TestData.payee.identity,
        });

        // the currencyManager provided to the requestNetwork object does not contain DAI
        expect(daiRequest.getData().currency).toBe('unknown');
      });
    });
  });
});
