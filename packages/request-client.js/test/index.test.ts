/* eslint-disable spellcheck/spell-checker */
const axios = require('axios');

import {
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ethers } from 'ethers';
import 'mocha';
import * as sinon from 'sinon';
const mockAdapter = require('axios-mock-adapter');
import { Request, RequestNetwork } from '../src/index';
import * as Types from '../src/types';
import * as TestData from './data-test';
import * as TestDataRealBTC from './data-test-real-btc';

import PaymentReferenceCalculator from '../src/api/payment-network/payment-reference-calculator';

const chai = require('chai');
const spies = require('chai-spies');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);
const sandbox = chai.spy.sandbox();

const signatureParametersPayee: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const signatureParametersPayer: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
};
const payeeIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const payerIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
};

const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
  sign: (data: any, signer: IdentityTypes.IIdentity): any => {
    if (signer.value === payeeIdentity.value) {
      return Utils.signature.sign(data, signatureParametersPayee);
    } else {
      return Utils.signature.sign(data, signatureParametersPayer);
    }
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [SignatureTypes.METHOD.ECDSA],
};

const encryptionData = {
  decryptionParams: {
    key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    method: Types.Encryption.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: Types.Encryption.METHOD.ECIES,
  },
  identity: {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
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
  payee: payeeIdentity,
  payer: payerIdentity,
  timestamp: 1549956270,
};

/* tslint:disable:no-magic-numbers */
function mockAxios(): any {
  const mock = new mockAdapter(axios);
  mock.onPost('/persistTransaction').reply(200, { result: {} });
  mock.onGet('/getTransactionsByChannelId').reply(200, {
    result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
  });
  return mock;
}

const mockBTCProvider = {
  getAddressBalanceWithEvents: (): Promise<
    Types.IBalanceWithEvents<Types.IBTCPaymentEventParameters>
  > => {
    return Promise.resolve({
      balance: '666743',
      events: [
        {
          amount: '666743',
          name: Types.EVENTS_NAMES.PAYMENT,
          parameters: {
            block: 561874,
            txHash: '4024936746a0994cf5cdf9c8b55e03b288a251ad172682e8e94b7806a4e3dace',
          },
        },
      ],
    });
  },
};

// Integration tests
/* tslint:disable:no-unused-expression */
describe('index', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('uses http://localhost:3000 with signatureProvider and paymentNetwork', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost:3000');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.timestampedTransaction] } });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
      id: Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });
    expect(spy).to.have.been.called.once;
  });

  it('uses http://localhost:3000 with persist from local', async () => {
    const mock = new mockAdapter(axios);
    const callback = (): any => {
      return [200, { ipfsSize: 100, ipfsHash: 'QmZLqH4EsjmB79gjvyzXWBcihbNBZkw8YuELco84PxGzQY' }];
    };
    // const spyPersistTransaction = chai.spy();
    const spyIpfsAdd = chai.spy(callback);
    // mock.onPost('/persistTransaction').reply(spyPersistTransaction);
    mock.onPost('/persistTransaction').reply(200, { meta: {}, result: {} });
    mock.onPost('/ipfsAdd').reply(spyIpfsAdd);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      meta: { storageMeta: [], transactionsStorageLocation: [] },
      result: { transactions: [] },
    });

    const requestNetwork = new RequestNetwork({
      ethereumProviderUrl: 'http://localhost:8545',
      signatureProvider: fakeSignatureProvider,
      useLocalEthereumBroadcast: true,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
      id: Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });
    // expect(spyPersistTransaction).to.not.have.been.called;
    expect(spyIpfsAdd).to.have.been.called.once;
  });

  it('uses http://localhost:3000 with signatureProvider and paymentNetwork real btc', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost:3000');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestDataRealBTC.timestampedTransaction] },
    });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
      id: Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
      },
    };

    await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: requestParameters,
      signer: payeeIdentity,
    });
    expect(spy).to.have.been.called.once;
  });

  it('uses http://localhost:3000 with signatureProvider', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost:3000');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });
    expect(spy).to.have.been.called.once;
  });

  it('uses baseUrl given in parameter', async () => {
    const baseURL = 'http://request.network/api';
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal(baseURL);
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });

    const requestNetwork = new RequestNetwork({
      nodeConnectionConfig: { baseURL },
      signatureProvider: fakeSignatureProvider,
    });
    await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });
    expect(spy).to.have.been.called.once;
  });

  it('allows to create a request', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    expect(request).to.be.instanceOf(Request);
    expect(request.requestId).to.exist;
    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(request.requestId.length).to.equal(requestIdLength);
  });

  it('allows to compute a request id', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const requestId = await requestNetwork.computeRequestId({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    expect(axiosSpyGet).to.not.have.been.called();
    expect(axiosSpyPost).to.not.have.been.called();

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(requestId.length).to.equal(requestIdLength);
  });

  it('allows to compute a request id, then generate the request with the same id', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const requestId = await requestNetwork.computeRequestId({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });
    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(requestId.length).to.equal(requestIdLength);

    await new Promise((resolve): any => setTimeout(resolve, 150));
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    expect(request).to.be.instanceOf(Request);
    expect(request.requestId).to.equal(requestId);
    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to get a request from its ID', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const requestFromId = await requestNetwork.fromRequestId(request.requestId);

    expect(requestFromId.requestId).to.equal(request.requestId);
  });

  it('allows to refresh a request', async () => {
    const mock = new mockAdapter(axios);
    mock.onPost('/persistTransaction').reply(200, { result: {} });
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsData] },
    });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const data = await request.refresh();

    expect(data).to.exist;
    expect(data.balance).to.be.null;
    expect(data.meta).to.exist;
    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.exactly(0);
  });

  it('works with mocked storage', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: fakeSignatureProvider,
      useMockStorage: true,
    });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const data = request.getData();
    expect(data).to.exist;
    expect(data.balance).to.be.null;
    expect(data.meta).to.exist;
    expect(data.currencyInfo).to.deep.equal(TestData.parametersWithoutExtensionsData.currency);
  });

  it('works with mocked storage and mocked payment network', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: fakeSignatureProvider,
      useMockStorage: true,
    });

    requestNetwork.bitcoinDetectionProvider = mockBTCProvider;

    const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
      id: Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const data = request.getData();

    expect(data).to.exist;
    expect(data.balance).to.exist;
    expect(data.meta).to.exist;
    expect(data.currencyInfo).to.deep.equal(TestData.parametersWithoutExtensionsData.currency);
  });

  it('works with mocked storage and content data', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: fakeSignatureProvider,
      useMockStorage: true,
    });

    const contentData = {
      invoice: true,
      what: 'ever',
    };

    const request = await requestNetwork.createRequest({
      contentData,
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const data = request.getData();
    expect(data).to.exist;
    expect(data.balance).to.be.null;
    expect(data.meta).to.exist;
  });

  it('allows to accept a request', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await expect(request.accept(payerIdentity)).to.eventually.be.rejectedWith(
      'request is expected (maybe transactions are still pending)',
    );

    // after confirmation
    const mock = new mockAdapter(axios);
    mock.onPost('/persistTransaction').reply(200, { result: {} });
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestData.timestampedTransactionWithoutExtensionsDataConfirmed] },
    });

    await request.accept(payerIdentity);

    expect(axiosSpyGet).to.have.been.called.exactly(4);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to cancel a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.cancel(payeeIdentity);

    expect(axiosSpyGet).to.have.been.called.exactly(3);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to increase the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.increaseExpectedAmountRequest(3, payerIdentity);

    expect(axiosSpyGet).to.have.been.called.exactly(3);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to reduce the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: TestData.parametersWithoutExtensionsData,
      signer: payeeIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.reduceExpectedAmountRequest(3, payeeIdentity);

    expect(axiosSpyGet).to.have.been.called.exactly(3);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  describe('tests with declarative payments', () => {
    beforeEach(() => {
      const mock = new mockAdapter(axios);

      const callback = (config: any): any => {
        expect(config.baseURL).to.equal('http://localhost:3000');
        return [200, {}];
      };
      const spy = chai.spy(callback);
      mock.onPost('/persistTransaction').reply(spy);
      mock.onGet('/getTransactionsByChannelId').reply(200, {
        result: { transactions: [TestData.timestampedTransactionWithDeclarative] },
      });
    });

    it('allows to declare a sent payment', async () => {
      const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: payeeIdentity,
      });

      const axiosSpyGet = sandbox.on(axios, 'get');
      const axiosSpyPost = sandbox.on(axios, 'post');

      await request.declareSentPayment('10', 'sent payment', payerIdentity);

      expect(axiosSpyGet).to.have.been.called.exactly(3);
      expect(axiosSpyPost).to.have.been.called.once;
    });

    it('allows to declare a received payment', async () => {
      const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: payeeIdentity,
      });

      const axiosSpyGet = sandbox.on(axios, 'get');
      const axiosSpyPost = sandbox.on(axios, 'post');

      await request.declareReceivedPayment('10', 'received payment', payeeIdentity);

      expect(axiosSpyGet).to.have.been.called.exactly(3);
      expect(axiosSpyPost).to.have.been.called.once;
    });

    it('allows to declare a sent refund', async () => {
      const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: payeeIdentity,
      });

      const axiosSpyGet = sandbox.on(axios, 'get');
      const axiosSpyPost = sandbox.on(axios, 'post');

      await request.declareSentRefund('10', 'sent refund', payeeIdentity);

      expect(axiosSpyGet).to.have.been.called.exactly(3);
      expect(axiosSpyPost).to.have.been.called.once;
    });

    it('allows to declare a received refund', async () => {
      const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: payeeIdentity,
      });

      const axiosSpyGet = sandbox.on(axios, 'get');
      const axiosSpyPost = sandbox.on(axios, 'post');

      await request.declareReceivedRefund('10', 'received refund', payerIdentity);

      expect(axiosSpyGet).to.have.been.called.exactly(3);
      expect(axiosSpyPost).to.have.been.called.once;
    });

    it('allows to get the right balance', async () => {
      // Use sinon clock to get a predictible timestamp
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      const requestParametersUSD: RequestLogicTypes.ICreateParameters = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        },
        expectedAmount: '100000000000',
        payee: payeeIdentity,
        payer: payerIdentity,
      };

      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });
      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {},
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: requestParametersUSD,
        signer: payeeIdentity,
      });

      clock.tick(150);
      await request.declareSentPayment('1', 'sent payment', payerIdentity);

      clock.tick(150);
      await request.declareReceivedRefund('10', 'received refund', payerIdentity);

      clock.tick(150);
      await request.declareSentRefund('100', 'sent refund', payeeIdentity);

      clock.tick(150);
      await request.declareReceivedPayment('1000', 'received payment', payeeIdentity);

      clock.tick(150);
      const requestData = await request.refresh();

      // @ts-ignore
      expect(requestData.balance.balance).to.equal('990');
      // @ts-ignore
      expect(requestData.balance.events[0]).to.deep.equal({
        amount: '10',
        name: 'refund',
        parameters: { note: 'received refund' },
        timestamp: 0,
      });
      // @ts-ignore
      expect(requestData.balance.events[1]).to.deep.equal({
        amount: '1000',
        name: 'payment',
        parameters: { note: 'received payment' },
        timestamp: 0,
      });
      sinon.restore();
    });

    it('cannot use declarative function if payment network is not declarative', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const salt = 'ea3bc7caf64110ca';

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
        paymentNetwork,
        requestInfo,
        signer: payeeIdentity,
      });

      await expect(
        request.declareReceivedRefund('10', 'received refund', payeeIdentity),
      ).to.eventually.be.rejectedWith(
        'Cannot declare received refund without declarative payment network',
      );

      await expect(
        request.declareReceivedPayment('10', 'received payment', payeeIdentity),
      ).to.eventually.be.rejectedWith(
        'Cannot declare received payment without declarative payment network',
      );

      await expect(
        request.declareSentRefund('10', 'sent refund', payeeIdentity),
      ).to.eventually.be.rejectedWith(
        'Cannot declare sent refund without declarative payment network',
      );

      await expect(
        request.declareSentPayment('10', 'sent payment', payeeIdentity),
      ).to.eventually.be.rejectedWith(
        'Cannot declare sent payment without declarative payment network',
      );
    });
  });

  describe('tests with encryption', () => {
    it('creates and reads an encrypted request', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
        },
        [encryptionData.encryptionParams],
      );

      const requestFromId = await requestNetwork.fromRequestId(request.requestId);

      expect(requestFromId).to.deep.equal(request);

      const requestData = requestFromId.getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );
    });

    it('cannot create an encrypted request without encryption parameters', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      await expect(
        requestNetwork._createEncryptedRequest(
          {
            requestInfo: TestData.parametersWithoutExtensionsData,
            signer: payeeIdentity,
          },
          [],
        ),
      ).to.eventually.be.rejectedWith(
        'You must give at least one encryption parameter to create an encrypted request',
      );
    });

    it('creates an encrypted request and recovers it by topic', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
          topics: ['my amazing test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestsFromTopic = await requestNetwork.fromTopic('my amazing test topic');
      expect(requestsFromTopic).to.not.be.empty;
      expect(requestsFromTopic[0]).to.deep.equal(request);

      const requestData = requestsFromTopic[0].getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );
    });

    it('creates multiple encrypted requests and recovers it by multiple topic', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
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
          signer: payeeIdentity,
          topics: ['my second best test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestsFromTopic = await requestNetwork.fromMultipleTopics([
        'my amazing test topic',
        'my second best test topic',
      ]);
      expect(requestsFromTopic).to.have.length(2);
      expect(requestsFromTopic[0]).to.deep.equal(request);
      expect(requestsFromTopic[1]).to.deep.equal(request2);

      requestsFromTopic.forEach(req => {
        const requestData = req.getData();
        expect(requestData.meta).to.not.be.null;
        expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
          'ecies-aes256-cbc',
        );
      });
    });

    it('creates an encrypted request and recovers it by identity', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
          topics: ['my amazing test topic'],
        },
        [encryptionData.encryptionParams],
      );

      const requestFromIdentity = await requestNetwork.fromIdentity(payeeIdentity);
      expect(requestFromIdentity).to.not.be.empty;
      expect(requestFromIdentity[0]).to.deep.equal(request);

      const requestData = requestFromIdentity[0].getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );
    });

    it('creates an encrypted request and accept it', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      expect(fetchedRequest).to.deep.equal(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );

      clock.tick(150);
      await fetchedRequest.accept(payerIdentity);

      clock.tick(150);
      expect((await fetchedRequest.refresh()).state).to.equal(RequestLogicTypes.STATE.ACCEPTED);
      sinon.restore();
    });

    it('creates an encrypted request and cancel it', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      expect(fetchedRequest).to.deep.equal(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );

      clock.tick(150);
      await fetchedRequest.cancel(payeeIdentity);
      clock.tick(150);
      expect((await fetchedRequest.refresh()).state).to.equal(RequestLogicTypes.STATE.CANCELED);
      sinon.restore();
    });

    it('creates an encrypted request, increase and decrease the amount', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      expect(fetchedRequest).to.deep.equal(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );

      clock.tick(150);
      await fetchedRequest.increaseExpectedAmountRequest(
        TestData.parametersWithoutExtensionsData.expectedAmount,
        payerIdentity,
      );

      clock.tick(150);
      expect((await fetchedRequest.refresh()).expectedAmount).to.equal(
        String(TestData.parametersWithoutExtensionsData.expectedAmount * 2),
      );

      await fetchedRequest.reduceExpectedAmountRequest(
        TestData.parametersWithoutExtensionsData.expectedAmount * 2,
        payeeIdentity,
      );

      clock.tick(150);
      expect((await fetchedRequest.refresh()).expectedAmount).to.equal('0');
      sinon.restore();
    });

    it('creates an encrypted declarative request, accepts it and declares a payment on it', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork._createEncryptedRequest(
        {
          paymentNetwork: TestData.declarativePaymentNetwork,
          requestInfo: TestData.parametersWithoutExtensionsData,
          signer: payeeIdentity,
        },
        [encryptionData.encryptionParams],
      );

      const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);
      expect(fetchedRequest).to.deep.equal(request);

      const requestData = fetchedRequest.getData();
      expect(requestData.meta).to.not.be.null;
      expect(requestData.meta!.transactionManagerMeta.encryptionMethod).to.equal(
        'ecies-aes256-cbc',
      );

      clock.tick(150);
      await fetchedRequest.accept(payerIdentity);
      clock.tick(150);
      expect((await fetchedRequest.refresh()).state).to.equal(RequestLogicTypes.STATE.ACCEPTED);

      await fetchedRequest.declareSentPayment(
        TestData.parametersWithoutExtensionsData.expectedAmount,
        'PAID',
        payerIdentity,
      );
      clock.tick(150);
      expect((await fetchedRequest.refresh()).balance!.balance).to.equal('0');

      await fetchedRequest.declareReceivedPayment(
        TestData.parametersWithoutExtensionsData.expectedAmount,
        'payment received',
        payeeIdentity,
      );
      clock.tick(150);
      expect((await fetchedRequest.refresh()).balance!.balance).to.equal(
        TestData.parametersWithoutExtensionsData.expectedAmount,
      );
      sinon.restore();
    });
  });

  describe('ETH requests', () => {
    it('can create ETH requests with given salt', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const salt = 'ea3bc7caf64110ca';

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
        paymentNetwork,
        requestInfo,
        signer: payeeIdentity,
      });

      clock.tick(150);
      const data = await request.refresh();

      expect(data).to.exist;
      expect(data.balance).to.exist;
      expect(data.meta).to.exist;
      expect(data.currency).to.equal('ETH-rinkeby');
      expect(data.extensionsData[0].parameters.salt).to.equal(salt);
      expect(data.expectedAmount).to.equal(requestParameters.expectedAmount);
      sinon.restore();
    });

    it('can create ETH requests without given salt', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
        paymentNetwork,
        requestInfo,
        signer: payeeIdentity,
      });

      clock.tick(150);
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).to.equal(16);
      sinon.restore();
    });

    it('can create ETH requests without refund address', async () => {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
        paymentNetwork,
        requestInfo,
        signer: payeeIdentity,
      });

      clock.tick(150);
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).to.equal(16);
      sinon.restore();
    });

    // This test checks that 2 payments with reference `fb8cc0abeed87cb8` have reached 0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB
    it('can get the balance of an ETH request', async function(): Promise<void> {
      const clock: sinon.SinonFakeTimers = sinon.useFakeTimers();

      // tslint:disable-next-line: no-invalid-this
      this.timeout(10000);
      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
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
        signer: payeeIdentity,
      });

      clock.tick(150);
      const data = await request.refresh();

      // Payment reference should be fixed
      expect(
        PaymentReferenceCalculator.calculate(
          data.requestId,
          data.extensionsData[0].parameters.salt,
          data.extensionsData[0].parameters.paymentAddress,
        ),
      ).to.equal('a93299ed2555d098');

      clock.tick(150);
      const dataAfterRefresh = await request.refresh();

      expect(dataAfterRefresh.balance?.balance).to.equal('138');
      expect(dataAfterRefresh.balance?.events.length).to.equal(2);

      expect(dataAfterRefresh.balance?.events[0].name).to.equal('payment');
      expect(dataAfterRefresh.balance?.events[0].amount).to.equal('133');
      expect(dataAfterRefresh.balance?.events[0].parameters!.txHash).to.equal(
        '0x62264de4fbbe866df28e4fad7b4d44058f1b6ec74bf7c767a14eb67198c93a4d',
      );

      expect(dataAfterRefresh.balance?.events[1].name).to.equal('payment');
      expect(dataAfterRefresh.balance?.events[1].amount).to.equal('5');
      expect(dataAfterRefresh.balance?.events[1].parameters!.txHash).to.equal(
        '0x74d5dafdfaa023583d8bb6993a873babd403a05b2286e556e2617801b130cb8e',
      );
      sinon.restore();
    });
  });

  describe('ERC20 address based requests', () => {
    it('can create ERC20 address based requests', async () => {
      const testErc20TokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });
      // generate address randomly to avoid collisions
      const paymentAddress =
        '0x' + (await Utils.crypto.CryptoWrapper.random32Bytes()).slice(12).toString('hex');
      const refundAddress =
        '0x' + (await Utils.crypto.CryptoWrapper.random32Bytes()).slice(12).toString('hex');

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
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
        signer: payeeIdentity,
      });

      await new Promise((resolve): any => setTimeout(resolve, 150));
      let data = await request.refresh();

      expect(data).to.exist;
      expect(data.balance?.balance).to.equal('0');
      expect(data.balance?.events.length).to.equal(0);
      expect(data.meta).to.exist;
      expect(data.currency).to.equal('unknown');
      expect(
        data.extensions[Types.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values.paymentAddress,
      ).to.equal(paymentAddress);
      expect(
        data.extensions[Types.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED].values.refundAddress,
      ).to.equal(refundAddress);
      expect(data.expectedAmount).to.equal(requestParameters.expectedAmount);

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
      expect(data.balance?.balance).to.equal('2');
      expect(data.balance?.events.length).to.equal(1);
      expect(data.balance?.events[0].amount).to.equal('2');
      expect(data.balance?.events[0].name).to.equal('payment');
      expect(data.balance?.events[0].timestamp).to.exist;
      expect(data.balance?.events[0].parameters.block).to.exist;
      expect(data.balance?.events[0].parameters.from.length).to.equal(42);
      expect(data.balance?.events[0].parameters.to.toLowerCase()).to.equal(paymentAddress);
      expect(data.balance?.events[0].parameters.txHash.length).to.equal(66);

      // check refund
      await contract.transfer(refundAddress, 1);

      data = await request.refresh();
      expect(data.balance?.balance).to.equal('1');
      expect(data.balance?.events.length).to.equal(2);
      expect(data.balance?.events[0].amount).to.equal('2');
      expect(data.balance?.events[0].name).to.equal('payment');
      expect(data.balance?.events[0].timestamp).to.exist;
      expect(data.balance?.events[0].parameters.block).to.exist;
      expect(data.balance?.events[0].parameters.from.length).to.equal(42);
      expect(data.balance?.events[0].parameters.to.toLowerCase()).to.equal(paymentAddress);
      expect(data.balance?.events[0].parameters.txHash.length).to.equal(66);
      expect(data.balance?.events[1].amount).to.equal('1');
      expect(data.balance?.events[1].name).to.equal('refund');
      expect(data.balance?.events[1].timestamp).to.exist;
      expect(data.balance?.events[1].parameters.block).to.exist;
      expect(data.balance?.events[1].parameters.from.length).to.equal(42);
      expect(data.balance?.events[1].parameters.to.toLowerCase()).to.equal(refundAddress);
      expect(data.balance?.events[1].parameters.txHash.length).to.equal(66);
    });
  });

  describe('ERC20 proxy contract requests', () => {
    it('can create ERC20 requests with given salt', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });
      const salt = 'ea3bc7caf64110ca';

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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
        signer: payeeIdentity,
      });

      await new Promise((resolve): any => setTimeout(resolve, 150));
      const data = await request.refresh();

      expect(data).to.exist;
      expect(data.balance?.balance).to.equal('90');
      expect(data.balance?.events.length).to.equal(2);
      expect(data.meta).to.exist;
      expect(data.currency).to.equal('unknown');
      expect(data.extensionsData[0].parameters.salt).to.equal(salt);
      expect(data.expectedAmount).to.equal(requestParameters.expectedAmount);
    });

    it('can create ERC20 requests without given salt', async () => {
      const requestNetwork = new RequestNetwork({
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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
        signer: payeeIdentity,
      });

      await new Promise((resolve): any => setTimeout(resolve, 150));
      const data = await request.refresh();

      expect(data.extensionsData[0].parameters.salt.length).to.equal(16);
    });
  });
});
