const axios = require('axios');
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import 'mocha';
const mockAdapter = require('axios-mock-adapter');
import { Request, RequestNetwork } from '../src/index';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const requestCreationHash: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const topics = [
  '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
];

// Integration tests
/* tslint:disable:no-unused-expression */
describe('index', () => {
  beforeEach(async () => {
    // Mock axios
    const mock = new mockAdapter(axios);
    mock.onPost('/persistTransaction').reply(200, { result: {} });
    mock.onGet('/getTransactionsByTopic').reply(200, { result: { transactions: [] } });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('uses http://localhost by default', async () => {
    const mock = new mockAdapter(axios);

    const callback = (config: any): any => {
      expect(config.baseURL).to.equal('http://localhost');
      return [200, {}];
    };
    const spy = chai.spy(callback);
    mock.onPost('/persistTransaction').reply(spy);

    const requestNetwork = new RequestNetwork();
    await requestNetwork.createRequest(requestCreationHash, signatureInfo, topics);
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

    const requestNetwork = new RequestNetwork({ baseURL });
    await requestNetwork.createRequest(requestCreationHash, signatureInfo, topics);
    expect(spy).to.have.been.called.once;
  });

  it('allows to create a request', async () => {
    const requestNetwork = new RequestNetwork();

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    expect(request).to.be.instanceOf(Request);
    expect(request.requestId).to.exist;
    expect(axiosSpyGet).to.have.been.called.exactly(0);
    expect(axiosSpyPost).to.have.been.called.once;

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(request.requestId.length).to.equal(requestIdLength);
  });

  it('allows to get a request from its ID', async () => {
    const requestNetwork = new RequestNetwork();

    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const requestFromId = requestNetwork.fromRequestId(request.requestId);

    expect(requestFromId.requestId).to.equal(request.requestId);
  });

  it('allows to get data a request', async () => {
    const requestNetwork = new RequestNetwork();
    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    const data = await request.getData();

    expect(data.result).to.exist;
    expect(axiosSpyGet).to.have.been.called.once;
    expect(axiosSpyPost).to.have.been.called.exactly(0);
  });

  it('allows to accept a request', async () => {
    const requestNetwork = new RequestNetwork();
    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.accept(signatureInfo);

    expect(axiosSpyGet).to.have.been.called.exactly(0);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to cancel a request', async () => {
    const requestNetwork = new RequestNetwork();
    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.cancel(signatureInfo);

    expect(axiosSpyGet).to.have.been.called.exactly(0);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to increase the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork();
    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.increaseExpectedAmountRequest(3, signatureInfo);

    expect(axiosSpyGet).to.have.been.called.exactly(0);
    expect(axiosSpyPost).to.have.been.called.once;
  });

  it('allows to reduce the expected amount a request', async () => {
    const requestNetwork = new RequestNetwork();
    const { request } = await requestNetwork.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );

    const axiosSpyGet = sandbox.on(axios, 'get');
    const axiosSpyPost = sandbox.on(axios, 'post');

    await request.reduceExpectedAmountRequest(3, signatureInfo);

    expect(axiosSpyGet).to.have.been.called.exactly(0);
    expect(axiosSpyPost).to.have.been.called.once;
  });
});
