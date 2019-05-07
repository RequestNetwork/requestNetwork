const axios = require('axios');

import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
  SignatureProvider as SignatureProviderTypes,
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
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

const signatureParameters: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const signerIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
  sign: (data: any): any => Utils.signature.sign(data, signatureParameters),
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [SignatureTypes.METHOD.ECDSA],
};

const requestParameters: RequestLogicTypes.ICreateParameters = {
  currency: RequestLogicTypes.CURRENCY.BTC,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

/* tslint:disable:no-magic-numbers */
function mockAxios(): any {
  const mock = new mockAdapter(axios);
  mock.onPost('/persistTransaction').reply(200, { result: {} });
  mock
    .onGet('/getTransactionsByChannelId')
    .reply(200, { result: { transactions: [TestData.transactionConfirmed] } });
  return mock;
}

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
      requestInfo: requestParameters,
      signer: signerIdentity,
    });
    expect(spy).to.have.been.called.once;
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
      signer: signerIdentity,
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
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.transactionConfirmed] } });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
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
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.transactionConfirmed] } });

    const requestNetwork = new RequestNetwork({
      nodeConnectionConfig: { baseURL },
      signatureProvider: fakeSignatureProvider,
    });
    await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });
    expect(spy).to.have.been.called.once;
  });

  it('allows to create a request', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    expect(request).to.be.instanceOf(Request);
    expect(request.requestId).to.exist;
    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(request.requestId.length).to.equal(requestIdLength);
  });

  it('allows to get a request from its ID', async () => {
    mockAxios();
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });

    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    const requestFromId = await requestNetwork.fromRequestId(request.requestId);

    expect(requestFromId.requestId).to.equal(request.requestId);
  });

  it('allows to refresh a request', async () => {
    const mock = new mockAdapter(axios);
    mock.onPost('/persistTransaction').reply(200, { result: {} });
    mock
      .onGet('/getTransactionsByChannelId')
      .reply(200, { result: { transactions: [TestData.transactionConfirmed] } });

    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
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
      requestInfo: requestParameters,
      signer: signerIdentity,
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
      requestInfo: requestParameters,
      signer: signerIdentity,
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
      requestInfo: requestParameters,
      signer: signerIdentity,
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
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.accept(signerIdentity);

    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to cancel a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.cancel(signerIdentity);

    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to increase the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.increaseExpectedAmountRequest(3, signerIdentity);

    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to reduce the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider: fakeSignatureProvider });
    const request = await requestNetwork.createRequest({
      requestInfo: requestParameters,
      signer: signerIdentity,
    });

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.reduceExpectedAmountRequest(3, signerIdentity);

    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.once;
  });
});
