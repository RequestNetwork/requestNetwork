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
import 'mocha';
const mockAdapter = require('axios-mock-adapter');
import { Request, RequestNetwork } from '../src/index';
import * as Types from '../src/types';
import * as TestData from './data-test';
import * as TestDataRealBTC from './data-test-real-btc';

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

const fakeDecryptionProvider: DecryptionProviderTypes.IDecryptionProvider = {
  decrypt: (data: string, identity: IdentityTypes.IIdentity): Promise<string> => {
    switch (identity.value.toLowerCase()) {
      case payeeIdentity.value:
        return Utils.encryption.decrypt(data, {
          key: signatureParametersPayee.privateKey,
          method: EncryptionTypes.METHOD.ECIES,
        });
      case payerIdentity.value:
        return Utils.encryption.decrypt(data, {
          key: signatureParametersPayer.privateKey,
          method: EncryptionTypes.METHOD.ECIES,
        });
      default:
        throw new Error('Identity not registered');
    }
  },
  isIdentityRegistered: async (identity: IdentityTypes.IIdentity): Promise<boolean> => {
    return [payeeIdentity.value, payerIdentity.value].includes(identity.value.toLowerCase());
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [EncryptionTypes.METHOD.ECIES],
};

const requestParameters: RequestLogicTypes.ICreateParameters = {
  currency: RequestLogicTypes.CURRENCY.BTC,
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
  timestamp: 1549956270,
};

/* tslint:disable:no-magic-numbers */
function mockAxios(): any {
  const mock = new mockAdapter(axios);
  mock.onPost('/persistTransaction').reply(200, { result: {} });
  mock
    .onGet('/getTransactionsByChannelId')
    .reply(200, { result: { transactions: [TestData.transactionConfirmedWithoutExtensionsData] } });
  return mock;
}

// Integration tests
/* tslint:disable:no-unused-expression */
describe('index', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it.skip('uses http://localhost:3000 with signatureProvider and paymentNetwork', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost:3000');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.transactionConfirmed] } });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

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

  it.skip('uses http://localhost:3000 with signatureProvider and paymentNetwork real btc', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost:3000');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);
    mock.onGet('/getTransactionsByChannelId').reply(200, {
      result: { transactions: [TestDataRealBTC.transactionConfirmed] },
    });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

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
      result: { transactions: [TestData.transactionConfirmedWithoutExtensionsData] },
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
      result: { transactions: [TestData.transactionConfirmedWithoutExtensionsData] },
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

    await new Promise((resolve): any => setTimeout(resolve, 1500));
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
      result: { transactions: [TestData.transactionConfirmedWithoutExtensionsData] },
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
    expect(data.expectedAmount).to.equal(requestParameters.expectedAmount);
  });

  it('works with mocked storage and payment network', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider: fakeSignatureProvider,
      useMockStorage: true,
    });

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
    expect(data.expectedAmount).to.equal(requestParameters.expectedAmount);
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

    await request.accept(payeeIdentity);

    expect(axiosSpyGet).to.have.been.called.twice;
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

    expect(axiosSpyGet).to.have.been.called.twice;
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

    await request.increaseExpectedAmountRequest(3, payeeIdentity);

    expect(axiosSpyGet).to.have.been.called.twice;
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

    expect(axiosSpyGet).to.have.been.called.twice;
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
        result: { transactions: [TestData.transactionConfirmedWithDeclarative] },
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

      await request.declareSentPayment('10', 'sent payment', payeeIdentity);

      expect(axiosSpyGet).to.have.been.called.twice;
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

      expect(axiosSpyGet).to.have.been.called.twice;
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

      expect(axiosSpyGet).to.have.been.called.twice;
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

      await request.declareReceivedRefund('10', 'received refund', payeeIdentity);

      expect(axiosSpyGet).to.have.been.called.twice;
      expect(axiosSpyPost).to.have.been.called.once;
    });

    it('allows to get the right balance', async () => {
      const requestParametersUSD: RequestLogicTypes.ICreateParameters = {
        currency: RequestLogicTypes.CURRENCY.USD,
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

      await request.declareSentPayment('1', 'sent payment', payerIdentity);
      await request.declareReceivedRefund('10', 'received refund', payerIdentity);

      await request.declareSentRefund('100', 'sent refund', payeeIdentity);
      await request.declareReceivedPayment('1000', 'received payment', payeeIdentity);

      const requestData = request.getData();
      // @ts-ignore
      expect(requestData.balance.balance).to.equal('990');
      // @ts-ignore
      expect(requestData.balance.events[0]).to.deep.equal({
        name: 'refund',
        parameters: { amount: '10', note: 'received refund' },
      });
      // @ts-ignore
      expect(requestData.balance.events[1]).to.deep.equal({
        name: 'payment',
        parameters: { amount: '1000', note: 'received payment' },
      });
    });

    it('cannot use declarative function if payment network is not declarative', async () => {
      const mock = new mockAdapter(axios);

      const callback = (config: any): any => {
        expect(config.baseURL).to.equal('http://localhost:3000');
        return [200, {}];
      };
      const spy = chai.spy(callback);
      mock.onPost('/persistTransaction').reply(spy);
      mock.onGet('/getTransactionsByChannelId').reply(200, {
        result: { transactions: [TestDataRealBTC.transactionConfirmed] },
      });

      const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

      const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
        parameters: {
          paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
        },
      };

      const request = await requestNetwork.createRequest({
        paymentNetwork,
        requestInfo: requestParameters,
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
    // beforeEach(() => {

    // });

    it('reads an encrypted request', async () => {
      const requestNetwork = new RequestNetwork({
        decryptionProvider: fakeDecryptionProvider,
        signatureProvider: fakeSignatureProvider,
        useMockStorage: true,
      });

      const request = await requestNetwork.createRequest({
        requestInfo: TestData.parametersWithoutExtensionsData,
        signer: payeeIdentity,
      });

      const requestFromId = await requestNetwork.fromRequestId(request.requestId);
      expect(requestFromId.requestId).to.equal(request.requestId);
    });
  });
});
