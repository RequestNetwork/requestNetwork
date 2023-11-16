import {
  ClientTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { decrypt, random32Bytes } from '@requestnetwork/utils';
import { BigNumber, ethers } from 'ethers';

import { Request, RequestNetwork, RequestNetworkBase } from '../src/index';
import * as TestData from './data-test';
import * as TestDataRealBTC from './data-test-real-btc';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import EtherscanProviderMock from './etherscan-mock';
import { IRequestDataWithEvents } from '../src/types';
import HttpMetaMaskDataAccess from '../src/http-metamask-data-access';
import { MockDataAccess } from '@requestnetwork/data-access';
import { CurrencyManager } from '@requestnetwork/currency';
import { MockStorage } from '../src/mock-storage';
import * as RequestLogic from '@requestnetwork/types/src/request-logic-types';
import { http, HttpResponse } from 'msw';
import { setupServer, SetupServer } from 'msw/node';

const httpConfig: Partial<ClientTypes.IHttpDataAccessConfig> = {
  getConfirmationDeferDelay: 0,
};

const idRaw1 = {
  decryptionParams: {
    key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  },
};

const idRaw2 = {
  decryptionParams: {
    key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key: '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const idRaw3 = {
  decryptionParams: {
    key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818b6337657a23f58581715fc610577292e521d0',
  },
};

const fakeDecryptionProvider: DecryptionProviderTypes.IDecryptionProvider = {
  decrypt: (
    data: EncryptionTypes.IEncryptedData,
    identity: IdentityTypes.IIdentity,
  ): Promise<string> => {
    switch (identity.value.toLowerCase()) {
      case idRaw1.identity.value:
        return decrypt(data, idRaw1.decryptionParams);

      case idRaw2.identity.value:
        return decrypt(data, idRaw2.decryptionParams);

      default:
        throw new Error('Identity not registered');
    }
  },
  isIdentityRegistered: async (identity: IdentityTypes.IIdentity): Promise<boolean> => {
    return [idRaw1.identity.value, idRaw2.identity.value].includes(identity.value.toLowerCase());
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [EncryptionTypes.METHOD.ECIES],
};

const thirdPartyDecryptionProvider: DecryptionProviderTypes.IDecryptionProvider = {
  decrypt: (
    data: EncryptionTypes.IEncryptedData,
    identity: IdentityTypes.IIdentity,
  ): Promise<string> => {
    switch (identity.value.toLowerCase()) {
      case idRaw3.identity.value:
        return decrypt(data, idRaw3.decryptionParams);

      default:
        throw new Error('Identity not registered');
    }
  },
  isIdentityRegistered: async (identity: IdentityTypes.IIdentity): Promise<boolean> => {
    return [idRaw3.identity.value].includes(identity.value.toLowerCase());
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
    PaymentTypes.IBalanceWithEvents<PaymentTypes.GenericEventParameters>
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

const salt = 'ea3bc7caf64110ca';

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
describe('request-client.js', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('API', () => {
    const spyPersistTransaction = jest.fn();
    const spyIpfsAdd = jest.fn();
    const spyGetTransactionsByChannelId = jest.fn();

    let mockServer: SetupServer;

    const requestCreationParams: ClientTypes.ICreateRequestParameters = {
      paymentNetwork: TestData.declarativePaymentNetworkNoPaymentInfo,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: TestData.payee.identity,
    };
    const mockedTransactions = {
      transactions: [TestData.timestampedTransactionWithoutPaymentInfo],
    };

    beforeAll(() => {
      mockServer = setupServer(
        http.post('*/persistTransaction', () => HttpResponse.json(spyPersistTransaction())),
        http.get('*/getTransactionsByChannelId', () =>
          HttpResponse.json(spyGetTransactionsByChannelId()),
        ),
        http.post('*/ipfsAdd', () => HttpResponse.json(spyIpfsAdd())),
        http.get('*/getConfirmedTransaction', () => HttpResponse.json({ result: {} })),
      );
      mockServer.listen({ onUnhandledRequest: 'bypass' });
    });
    beforeEach(() => {
      spyPersistTransaction.mockReturnValue({});
      spyGetTransactionsByChannelId.mockReturnValue({ result: mockedTransactions });
    });
    afterAll(() => {
      mockServer.close();
    });

    it('specify the Request Client version in the header', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
        paymentOptions: {
          bitcoinDetectionProvider: mockBTCProvider,
        },
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      expect(spyPersistTransaction).toHaveBeenCalledTimes(1);

      await request.waitForConfirmation();
    });

    it('uses http://localhost:3000 with signatureProvider and paymentNetwork', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
        paymentOptions: {
          bitcoinDetectionProvider: mockBTCProvider,
        },
      });

      const request = await requestNetwork.createRequest(requestCreationParams);
      expect(spyPersistTransaction).toHaveBeenCalledTimes(1);

      await request.waitForConfirmation();
    });

    it('uses http://localhost:3000 with persist from local', async () => {
      spyGetTransactionsByChannelId.mockReturnValue({
        meta: { storageMeta: [], transactionsStorageLocation: [] },
        result: { transactions: [] },
      });
      spyIpfsAdd.mockReturnValue({
        ipfsSize: 100,
        ipfsHash: 'QmZLqH4EsjmB79gjvyzXWBcihbNBZkw8YuELco84PxGzQY',
      });

      const requestNetwork = new RequestNetworkBase({
        dataAccess: new HttpMetaMaskDataAccess({
          httpConfig,
          ethereumProviderUrl: 'http://localhost:8545',
        }),
        signatureProvider: TestData.fakeSignatureProvider,
        paymentOptions: {
          bitcoinDetectionProvider: mockBTCProvider,
        },
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
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
      spyGetTransactionsByChannelId.mockReturnValue({
        result: {
          transactions: [TestDataRealBTC.timestampedTransaction],
        },
      });

      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
        paymentOptions: {
          bitcoinDetectionProvider: mockBTCProvider,
        },
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
        parameters: {
          paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
        },
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: requestParameters,
        signer: TestData.payee.identity,
      });
      expect(spyPersistTransaction).toHaveBeenCalledTimes(1);

      await request.waitForConfirmation();
    });

    it('uses http://localhost:3000 with signatureProvider', async () => {
      spyGetTransactionsByChannelId.mockReturnValue({
        result: {
          transactions: [TestData.timestampedTransactionWithoutExtensionsData],
        },
      });

      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      expect(spyPersistTransaction).toHaveBeenCalledTimes(1);
    });

    it('uses baseUrl given in parameter', async () => {
      const baseURL = 'http://request.network/api';
      spyGetTransactionsByChannelId.mockReturnValue({
        result: {
          transactions: [TestData.timestampedTransactionWithoutExtensionsData],
        },
      });

      const requestNetwork = new RequestNetwork({
        httpConfig,
        nodeConnectionConfig: { baseURL },
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      expect(spyPersistTransaction).toHaveBeenCalledTimes(1);

      await request.waitForConfirmation();
    });
  });

  describe('Request Logic without encryption', () => {
    let mockServer: SetupServer;
    let hits: Record<string, number> = {};

    beforeAll(() => {
      mockServer = TestData.mockRequestNode();
      mockServer.events.on('request:start', ({ request }) => {
        hits[request.method.toLowerCase()]++;
      });
    });
    afterAll(() => {
      mockServer.events.removeAllListeners();
      mockServer.resetHandlers();
      mockServer.close();
    });
    beforeEach(() => {
      hits = { get: 0, post: 0 };
    });
    afterEach(() => {
      // mock.resetHandlers();
    });
    it('allows to create a request', async () => {
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
      expect(hits.get).toBe(3);
      expect(hits.post).toBe(1);

      // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
      const requestIdLength = 66;
      expect(request.requestId.length).toBe(requestIdLength);
    });

    it('allows to compute a request id', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });

      const requestId = await requestNetwork.computeRequestId({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });

      expect(hits.get).toBe(0);
      expect(hits.post).toBe(0);

      // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
      const requestIdLength = 66;
      expect(requestId.length).toBe(requestIdLength);
    });

    it('allows to compute a request id, then generate the request with the same id', async () => {
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
      expect(hits.get).toBe(3);
      expect(hits.post).toBe(1);
    });

    it('allows to get a request from its ID', async () => {
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

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
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
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      // reset hits
      hits = { get: 0, post: 0 };

      const data = await request.refresh();

      expect(data).toBeDefined();
      expect(data.balance).toBeNull();
      expect(data.meta).toBeDefined();
      expect(hits.get).toBe(1);
      expect(hits.post).toBe(0);
    });

    it('works with mocked storage', async () => {
      const mockStorage = new MockStorage();
      const mockDataAccess = new MockDataAccess(mockStorage);
      const requestNetwork = new RequestNetworkBase({
        dataAccess: mockDataAccess,
        signatureProvider: TestData.fakeSignatureProvider,
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
      const mockStorage = new MockStorage();
      const mockDataAccess = new MockDataAccess(mockStorage);
      const requestNetwork = new RequestNetworkBase({
        signatureProvider: TestData.fakeSignatureProvider,
        dataAccess: mockDataAccess,
      });

      // ask mock up storage to emit error next append call()
      mockStorage._makeNextAppendFailInsteadOfConfirmed();

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

      const errorEmitted: string = await new Promise((resolve): any =>
        request.on('error', resolve),
      );
      expect(errorEmitted).toBe('forced error asked by _makeNextAppendFailInsteadOfConfirmed()');

      expect(() => request.getData()).toThrow('request confirmation failed');
      await expect(request.refresh()).rejects.toThrowError('request confirmation failed');
    });

    it('works with mocked storage emitting error when append waitForConfirmation will throw', async () => {
      const mockStorage = new MockStorage();
      const mockDataAccess = new MockDataAccess(mockStorage);
      const requestNetworkInside = new RequestNetworkBase({
        signatureProvider: TestData.fakeSignatureProvider,
        dataAccess: mockDataAccess,
      });

      // ask mock up storage to emit error next append call()
      mockStorage._makeNextAppendFailInsteadOfConfirmed();

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
        paymentOptions: {
          bitcoinDetectionProvider: mockBTCProvider,
        },
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
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
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      // reset hits
      hits = { get: 0, post: 0 };
      const requestDataWithEvents = await request.accept(TestData.payer.identity);
      await waitForConfirmation(requestDataWithEvents);

      expect(hits.get).toBe(5);
      expect(hits.post).toBe(1);
    });

    it('works with mocked storage emitting error when append an accept', async () => {
      const mockStorage = new MockStorage();
      const mockDataAccess = new MockDataAccess(mockStorage);
      const requestNetwork = new RequestNetworkBase({
        signatureProvider: TestData.fakeSignatureProvider,
        dataAccess: mockDataAccess,
      });

      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      // ask mock up storage to emit error next append call()
      mockStorage._makeNextAppendFailInsteadOfConfirmed();
      await request.accept(TestData.payer.identity);

      let data = request.getData();
      expect(data).toBeDefined();
      expect(data.balance).toBeNull();
      expect(data.meta).toBeDefined();
      expect(data.currencyInfo).toMatchObject(TestData.parametersWithoutExtensionsData.currency);
      expect(data.state).toBe(RequestLogicTypes.STATE.CREATED);
      expect(data.pending?.state).toBe(RequestLogicTypes.STATE.ACCEPTED);

      const errorEmitted: string = await new Promise((resolve): any =>
        request.on('error', resolve),
      );
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
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();
      // reset hits
      hits = { get: 0, post: 0 };
      await waitForConfirmation(request.cancel(TestData.payee.identity));

      expect(hits.get).toBe(5);
      expect(hits.post).toBe(1);
    });

    it('allows to increase the expected amount a request', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();
      // reset hits
      hits = { get: 0, post: 0 };
      await waitForConfirmation(request.increaseExpectedAmountRequest(3, TestData.payer.identity));

      expect(hits.get).toBe(5);
      expect(hits.post).toBe(1);
    });

    it('allows to reduce the expected amount a request', async () => {
      const requestNetwork = new RequestNetwork({
        httpConfig,
        signatureProvider: TestData.fakeSignatureProvider,
      });
      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: TestData.payee.identity,
      });
      await request.waitForConfirmation();

      // reset hits
      hits = { get: 0, post: 0 };
      await waitForConfirmation(request.reduceExpectedAmountRequest(3, TestData.payee.identity));

      expect(hits.get).toBe(5);
      expect(hits.post).toBe(1);
    });
  });

  describe('Request Logic with encryption', () => {
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
        [idRaw1.encryptionParams],
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
        [idRaw1.encryptionParams],
      );

      await request.waitForConfirmation();

      const requestsFromTopic = await requestNetwork.fromTopic('my amazing test topic');
      expect(requestsFromTopic).not.toHaveLength(0);
      const requestData = requestsFromTopic[0].getData();
      expect(requestData).toMatchObject(request.getData());

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
        [idRaw1.encryptionParams],
      );

      await request.waitForConfirmation();

      const request2 = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: {
            ...TestData.parametersWithoutExtensionsData,
            timestamp: (TestData.parametersWithoutExtensionsData.timestamp || 1) + 1,
          },
          signer: TestData.payee.identity,
          topics: ['my second best test topic'],
        },
        [idRaw1.encryptionParams],
      );
      await request2.waitForConfirmation();

      const requestsFromTopic = await requestNetwork.fromMultipleTopics([
        'my amazing test topic',
        'my second best test topic',
      ]);
      expect(requestsFromTopic).toHaveLength(2);
      expect(requestsFromTopic[0].getData()).toMatchObject(request.getData());
      expect(requestsFromTopic[1].getData()).toMatchObject(request2.getData());

      requestsFromTopic.forEach((req) => {
        const requestData = req.getData();
        expect(requestData.meta).not.toBeNull();
        expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
      });
    }, 15000);

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
        [idRaw1.encryptionParams],
      );
      await request.waitForConfirmation();

      const requestFromIdentity = await requestNetwork.fromIdentity(TestData.payee.identity);
      expect(requestFromIdentity).not.toBe('');
      const requestData = requestFromIdentity[0].getData();
      expect(requestData).toMatchObject(request.getData());

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
        [idRaw1.encryptionParams],
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
      jest.useFakeTimers();
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
        [idRaw1.encryptionParams],
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
      jest.useFakeTimers();
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
        [idRaw1.encryptionParams],
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
        [idRaw1.encryptionParams],
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

    it('creates an encrypted request, adds a stakeholder, and fetches request by id using 2nd request network instance', async () => {
      const mockStorage = new MockStorage();
      const mockDataAccess = new MockDataAccess(mockStorage);

      const payeeRequestNetwork = new RequestNetworkBase({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        dataAccess: mockDataAccess,
      });

      // Create encrypted request with 2 stakeholders
      const request = await payeeRequestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: TestData.payee.identity,
        },
        [idRaw1.encryptionParams, idRaw2.encryptionParams],
      );
      const fetchedRequest = await payeeRequestNetwork.fromRequestId(request.requestId);
      const requestData = fetchedRequest.getData();
      expect(requestData).toMatchObject(request.getData());
      expect(requestData.meta).not.toBeNull();
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
      expect(requestData.events).toHaveLength(1);
      expect(requestData.events[0].name).toBe('create');

      // Add a 3rd stakeholder
      const requestDataAfterAddStakeholders = await waitForConfirmation(
        fetchedRequest.addStakeholders([idRaw3.encryptionParams], TestData.payee.identity),
      );
      expect(requestDataAfterAddStakeholders.state).toBe(RequestLogicTypes.STATE.CREATED);
      expect(requestDataAfterAddStakeholders.meta).not.toBeNull();
      expect(requestDataAfterAddStakeholders.meta!.transactionManagerMeta.encryptionMethod).toBe(
        'ecies-aes256-gcm',
      );
      expect(requestDataAfterAddStakeholders.events).toHaveLength(2);
      expect(requestDataAfterAddStakeholders.events[1].name).toBe('addStakeholders');

      // Fetch request by id using third party request network instance
      const thirdPartyRequestNetwork = new RequestNetworkBase({
        decryptionProvider: thirdPartyDecryptionProvider,
        signatureProvider: TestData.fakeSignatureProvider,
        dataAccess: mockDataAccess,
      });
      const thirdPartyFetchedRequest = await thirdPartyRequestNetwork.fromRequestId(
        request.requestId,
      );
      const thirdPartyRequestData = thirdPartyFetchedRequest.getData();

      expect(thirdPartyRequestData).toMatchObject(requestDataAfterAddStakeholders);
    });
  });

  describe('ETH requests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('can create ETH requests with given salt', async () => {
      jest.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
      jest.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
      jest.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
      await request.waitForConfirmation();

      const data = await request.refresh();

      // Payment reference should be fixed
      expect(
        PaymentReferenceCalculator.calculate(
          data.requestId,
          data.extensionsData[0].parameters.salt,
          data.extensionsData[0].parameters.paymentAddress,
        ),
      ).toBe('efce79375b2db9f7');

      const dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events.length).toBe(1);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );
    });

    it('can disable and enable the get the balance of a request', async () => {
      jest.useFakeTimers();

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

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
      ).toBe('efce79375b2db9f7');

      jest.advanceTimersByTime(150);
      let dataAfterRefresh = await request.refresh();
      expect(dataAfterRefresh.balance).toBeNull();

      request.enablePaymentDetection();
      jest.advanceTimersByTime(150);
      dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events.length).toBe(1);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );

      request.disablePaymentDetection();
      jest.advanceTimersByTime(150);
      dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events.length).toBe(1);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );
      jest.useRealTimers();
    });

    it('can get the balance on a skipped payment detection request', async () => {
      jest.useFakeTimers();

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

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
      ).toBe('efce79375b2db9f7');

      jest.advanceTimersByTime(150);
      let dataAfterRefresh = await request.refresh();
      expect(dataAfterRefresh.balance).toBeNull();

      const balance = await request.refreshBalance();
      expect(balance?.balance).toBe('12300000000');
      expect(balance?.events.length).toBe(1);

      expect(balance?.events[0].name).toBe('payment');
      expect(balance?.events[0].amount).toBe('12300000000');
      expect(balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
      );
      dataAfterRefresh = request.getData();

      expect(dataAfterRefresh.balance?.balance).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events.length).toBe(1);

      expect(dataAfterRefresh.balance?.events[0].name).toBe('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).toBe('12300000000');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).toBe(
        '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
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
      const paymentAddress = '0x' + (await random32Bytes()).slice(12).toString('hex');
      const refundAddress = '0x' + (await random32Bytes()).slice(12).toString('hex');

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
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
        data.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values
          .paymentAddress,
      ).toBe(paymentAddress);
      expect(
        data.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values.refundAddress,
      ).toBe(refundAddress);
      expect(data.expectedAmount).toBe(requestParameters.expectedAmount);

      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      const erc20abiFragment = [
        'function transfer(address _to, uint _value) returns (bool transfer)',
      ];

      // Set up the ERC20 contract interface
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

  it('Can create ERC20 declarative requests with non-evm currency - near', async () => {
    const testErc20TokenAddress = 'usdc.near';
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
      parameters: {},
    };

    const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
      currency: {
        network: 'aurora',
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

    expect(data.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE].values).toEqual({
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    });
    expect(data.expectedAmount).toBe(requestParameters.expectedAmount);
  });

  it('Can create ERC20 declarative requests with non-evm currency - solana', async () => {
    const testErc20TokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
      parameters: {},
    };

    const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
      currency: {
        network: 'solana',
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

    expect(data.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE].values).toEqual({
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    });
    expect(data.expectedAmount).toBe(requestParameters.expectedAmount);
  });

  it('cannot create ERC20 address based requests with invalid currency', async () => {
    const testErc20TokenAddress = 'invalidErc20Address';

    const requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
      useMockStorage: true,
    });

    // generate address randomly to avoid collisions
    const paymentAddress = '0x' + (await random32Bytes()).slice(12).toString('hex');
    const refundAddress = '0x' + (await random32Bytes()).slice(12).toString('hex');

    const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
      parameters: {
        paymentAddress,
        refundAddress,
      },
    };

    const requestInfo = Object.assign({}, TestData.parametersWithoutExtensionsData, {
      currency: {
        network: 'aurora',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: testErc20TokenAddress,
      },
    });

    await expect(
      requestNetwork.createRequest({
        paymentNetwork,
        requestInfo,
        signer: TestData.payee.identity,
      }),
    ).rejects.toThrowError('The currency is not valid');
  });

  describe('ERC20 proxy contract requests', () => {
    it('can create ERC20 requests with given salt', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });
      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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

  describe('ERC20 transferable receivable contract requests', () => {
    it('can create ERC20 transferable receivable requests', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE,
        parameters: {
          paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
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

  describe('Conversion requests: payment chain should be deduced from the payment network parameters', () => {
    it('creates any-to-erc20 requests', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
        parameters: {
          network: 'goerli',
          paymentAddress: '0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc',
          acceptedTokens: ['0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc'],
          salt,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersUSDWithoutExtensionsData);

      const request = await requestNetwork.createRequest({
        requestInfo,
        paymentNetwork,
        signer: TestData.payee.identity,
        disablePaymentDetection: true,
      });
      const data = await request.waitForConfirmation();

      expect(data).toBeDefined();
      expect(data.balance?.error).toBeUndefined();
      expect(data.balance?.balance).toBeUndefined();
      expect(data.meta).toBeDefined();
      expect(data.currency).toBe('USD');
      expect(data.extensionsData.length).toBe(1);
      expect(data.extensionsData[0].parameters.network).toBe('goerli');
      expect(data.extensionsData[0].id).toBe('pn-any-to-erc20-proxy');
      expect(data.expectedAmount).toBe(TestData.parametersUSDWithoutExtensionsData.expectedAmount);
    }, 10000);

    // FIXME: Near should get conversion again with Pyth.
    it.skip('can create any-to-native requests', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
        parameters: {
          network: 'aurora',
          paymentAddress: 'paymentaddress.near',
          salt,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersUSDWithoutExtensionsData);

      const request = await requestNetwork.createRequest({
        requestInfo,
        paymentNetwork,
        signer: TestData.payee.identity,
        disablePaymentDetection: true,
      });
      const data = await request.waitForConfirmation();

      expect(data).toBeDefined();
      expect(data.balance?.error).toBeUndefined();
      expect(data.balance?.balance).toBeUndefined();
      expect(data.meta).toBeDefined();
      expect(data.currency).toBe('USD');
      expect(data.extensionsData.length).toBe(1);
      expect(data.extensionsData[0].parameters.network).toBe('aurora');
      expect(data.extensionsData[0].id).toBe('pn-any-to-native-token');
      expect(data.expectedAmount).toBe(TestData.parametersUSDWithoutExtensionsData.expectedAmount);
    });
    it('cannot create conversion requests on networks not supported', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
        parameters: {
          network: 'mainnet', // This network is not supported for any-to-native
          paymentAddress: 'paymentaddress.near',
          salt,
        },
      };

      const requestInfo = Object.assign({}, TestData.parametersUSDWithoutExtensionsData);

      await expect(
        requestNetwork.createRequest({
          requestInfo,
          paymentNetwork,
          signer: TestData.payee.identity,
          disablePaymentDetection: true,
        }),
      ).rejects.toThrowError(
        'the pn-any-to-native-token extension is not supported for the network mainnet',
      );
    });
  });

  describe('Token lists', () => {
    const testErc20Data: RequestLogic.ICreateParameters = {
      ...TestData.parametersWithoutExtensionsData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // Test Erc20
      },
    };
    const daiData: RequestLogic.ICreateParameters = {
      ...TestData.parametersWithoutExtensionsData,
      currency: {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      },
    };
    const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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
      const currencyManager = new CurrencyManager(CurrencyManager.getDefaultList());
      const ETH = currencyManager.from('ETH', 'mainnet');

      const requestNetwork = new RequestNetwork({
        signatureProvider: TestData.fakeSignatureProvider,
        useMockStorage: true,
        currencies: [
          {
            network: 'mainnet',
            type: RequestLogicTypes.CURRENCY.ETH,
            decimals: ETH!.decimals,
            symbol: ETH!.symbol,
          },
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
