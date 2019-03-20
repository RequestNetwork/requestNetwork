import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
import Utils from '@requestnetwork/utils';

import { assert } from 'chai';
import 'mocha';

const payeeIdentity: Types.Identity.IIdentity = {
  type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const payerIdentity: Types.Identity.IIdentity = {
  type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};

const requestCreationHash: Types.RequestLogic.ICreateParameters = {
  currency: Types.RequestLogic.CURRENCY.BTC,
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const topics = [payerIdentity.value, payeeIdentity.value];

const signatureProvider = new EthereumPrivateKeySignatureProvider({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
});

describe('Request client using a request node', () => {
  it('can create a request, change the amount and get data', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    // Create a request
    const request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash,
      signer: payeeIdentity,
      topics,
    });
    assert.instanceOf(request, Request);
    assert.exists(request.requestId);

    // Get the data
    let requestData = await request.getData();
    assert.equal(requestData.expectedAmount, '100000000000');
    assert.equal(requestData.balance, null);
    assert.exists(requestData.meta);

    // Reduce the amount and get the data
    await request.reduceExpectedAmountRequest('20000000000', payeeIdentity);
    requestData = await request.getData();
    assert.equal(requestData.expectedAmount, '80000000000');
    assert.equal(requestData.balance, null);
    assert.exists(requestData.meta);
  });

  it('can create a request with payment network and content data', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    const paymentNetwork: Types.IPaymentNetworkCreateParameters = {
      id: Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        // eslint-disable-next-line spellcheck/spell-checker
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    const contentData = {
      it: 'is',
      some: 'content',
      true: true,
    };

    // Create a request
    const request = await requestNetwork.createRequest({
      contentData,
      paymentNetwork,
      requestInfo: requestCreationHash,
      signer: payeeIdentity,
      topics,
    });
    assert.instanceOf(request, Request);
    assert.exists(request.requestId);

    // Get the data
    const requestData = await request.getData();
    assert.equal(requestData.expectedAmount, '100000000000');
    assert.exists(requestData.balance);
    assert.exists(requestData.meta);
  });

  it('can create requests and get them fromIdentity and with time boundaries', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    // create request 1
    const requestCreationHash1: Types.RequestLogic.ICreateParameters = {
      currency: Types.RequestLogic.CURRENCY.BTC,
      expectedAmount: '100000000',
      payee: payeeIdentity,
      payer: payerIdentity,
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    const topicsRequest1and2 = [Utils.crypto.normalizeKeccak256Hash(requestCreationHash1)];

    const request1: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash1,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // create request 2
    const requestCreationHash2: Types.RequestLogic.ICreateParameters = {
      currency: Types.RequestLogic.CURRENCY.ETH,
      expectedAmount: '1000',
      payee: payeeIdentity,
      payer: payerIdentity,
    };

    const request2: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash2,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // reduce request 1
    const timestampBeforeReduce = Utils.getCurrentTimestampInSecond();

    await request1.reduceExpectedAmountRequest('10000000', payeeIdentity);

    // cancel request 1
    await request1.cancel(payeeIdentity);

    // get requests without boundaries
    let requests = await requestNetwork.fromTopic(topicsRequest1and2[0]);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].requestId, request1.requestId);
    assert.equal(requests[1].requestId, request2.requestId);

    let requestData1 = requests[0].getData();
    assert.equal(requestData1.state, Types.RequestLogic.STATE.CANCELED);
    assert.equal(requestData1.expectedAmount, '90000000');

    const requestData2 = requests[1].getData();
    assert.equal(requestData2.state, Types.RequestLogic.STATE.CREATED);

    // get requests with boundaries
    requests = await requestNetwork.fromTopic(topicsRequest1and2[0], {
      from: timestampBeforeReduce,
    });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].requestId, request1.requestId);

    requestData1 = requests[0].getData();
    assert.equal(requestData1.state, Types.RequestLogic.STATE.CANCELED);
    assert.equal(requestData1.expectedAmount, '90000000');
  });
});
