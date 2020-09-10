import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import MultiFormat from '@requestnetwork/multi-format';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
import { IdentityTypes, PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

// tslint:disable-next-line: no-magic-numbers
jest.setTimeout(10000);

const payeeIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const payerIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
};

const requestCreationHashBTC: Types.IRequestInfo = {
  currency: 'BTC',
  expectedAmount: '1000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const requestCreationHashUSD: Types.IRequestInfo = {
  currency: 'USD',
  expectedAmount: '1000',
  payee: payeeIdentity,
  payer: payerIdentity,
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
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

// Decryption provider setup
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
  encryptionData.decryptionParams,
);

// Wrong decryption provider
const wrongDecryptionProvider = new EthereumPrivateKeyDecryptionProvider({
  key: '0x0000000000111111111122222222223333333333444444444455555555556666',
  method: Types.Encryption.METHOD.ECIES,
});

const signatureProvider = new EthereumPrivateKeySignatureProvider({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
});
signatureProvider.addSignatureParameters({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
});

describe('Request client using a request node', () => {
  it('can create a request, change the amount and get data', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    // Create a request
    const request = await requestNetwork.createRequest({
      requestInfo: requestCreationHashBTC,
      signer: payeeIdentity,
    });
    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();

    // Get the data
    let requestData = request.getData();
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.PENDING);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.state).toBe(Types.RequestLogic.STATE.CREATED);

    requestData = await request.waitForConfirmation();
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();

    // Reduce the amount and get the data
    requestData = await request.reduceExpectedAmountRequest('200', payeeIdentity);
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.expectedAmount).toBe('800');

    requestData = await new Promise((resolve): any => requestData.on('confirmed', resolve));
    expect(requestData.expectedAmount).toBe('800');
    expect(requestData.pending).toBeNull();
  });

  // TODO since the migration to jest, this test fails.
  it.skip('can create a request with declarative payment network and content data', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
      parameters: {
        paymentInfo: {
          paymentInstruction: 'Arbitrary payment instruction',
        },
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
      requestInfo: requestCreationHashUSD,
      signer: payeeIdentity,
    });
    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();

    // Get the data
    let requestData = request.getData();
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.PENDING);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.state).toBe(Types.RequestLogic.STATE.CREATED);

    const extension = requestData.extensions[PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE];
    expect(extension).toBeDefined();
    expect(extension.events[0].name).toBe('create');
    expect(extension.events[0].parameters).toEqual(paymentNetwork.parameters);

    requestData = await request.waitForConfirmation();
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();

    await request.declareSentPayment('100', 'bank transfer initiated', payerIdentity);
    expect(requestData.balance).toBeDefined();
    expect(requestData.balance!.balance).toBe('0');

    requestData = await new Promise((resolve): any => requestData.on('confirmed', resolve));
    expect(requestData.balance!.balance).toBe('0');

    requestData = await request.declareReceivedPayment(
      '100',
      'bank transfer received',
      payeeIdentity,
    );
    expect(requestData.balance).toBeDefined();
    expect(requestData.balance!.balance).toBe('0');

    requestData = await new Promise((resolve): any => requestData.on('confirmed', resolve));
    expect(requestData.balance!.balance).toBe('100');
  });

  it('can create requests and get them fromIdentity and with time boundaries', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    // create request 1
    const requestCreationHash1: Types.IRequestInfo = {
      currency: 'BTC',
      expectedAmount: '100000000',
      payee: payeeIdentity,
      payer: payerIdentity,
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    const topicsRequest1and2: string[] = [
      MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(requestCreationHash1)),
    ];

    const request1: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash1,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // create request 2
    const requestCreationHash2: Types.IRequestInfo = {
      currency: 'BTC',
      expectedAmount: '1000',
      payee: payeeIdentity,
      payer: payerIdentity,
      timestamp: Utils.getCurrentTimestampInSecond(),
    };

    const request2: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash2,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // wait 1,5 sec and store the timestamp
    // tslint:disable:no-magic-numbers
    // tslint:disable-next-line:typedef
    await new Promise((r) => setTimeout(r, 1500));
    const timestampBeforeReduce = Utils.getCurrentTimestampInSecond();

    // reduce request 1
    await request1.reduceExpectedAmountRequest('10000000', payeeIdentity);

    // cancel request 1
    await request1.cancel(payeeIdentity);

    // get requests without boundaries
    let requests = await requestNetwork.fromTopic(topicsRequest1and2[0]);
    expect(requests.length).toBe(2);
    expect(requests[0].requestId).toBe(request1.requestId);
    expect(requests[1].requestId).toBe(request2.requestId);

    let requestData1 = requests[0].getData();
    expect(requestData1.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestData1.expectedAmount).toBe('90000000');

    const requestData2 = requests[1].getData();
    expect(requestData2.state).toBe(Types.RequestLogic.STATE.CREATED);

    // get requests with boundaries
    requests = await requestNetwork.fromTopic(topicsRequest1and2[0], {
      from: timestampBeforeReduce,
    });
    expect(requests.length).toBe(1);
    expect(requests[0].requestId).toBe(request1.requestId);

    requestData1 = requests[0].getData();
    expect(requestData1.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestData1.expectedAmount).toBe('90000000');
  });

  it('can create requests and get them fromIdentity with smart contract identity', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    const payerSmartContract = {
      network: 'private',
      type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
      value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
    };

    const timestampCreation = Utils.getCurrentTimestampInSecond();

    // create request 1
    const topicsRequest1and2: string[] = [
      MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(timestampCreation)),
    ];
    const request1: Request = await requestNetwork.createRequest({
      requestInfo: {
        currency: 'BTC',
        expectedAmount: '100000000',
        payee: payeeIdentity,
        payer: payerSmartContract,
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // create request 2 to be sure it is not found when search with smart contract identity
    await requestNetwork.createRequest({
      requestInfo: {
        currency: 'BTC',
        expectedAmount: '1000',
        payee: payeeIdentity,
        payer: payerIdentity,
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // wait 1,5 sec and store the timestamp
    // tslint:disable:no-magic-numbers
    // tslint:disable-next-line:typedef
    await new Promise((r) => setTimeout(r, 1500));

    // get requests with boundaries
    const requests = await requestNetwork.fromIdentity(payerSmartContract, {
      from: timestampCreation,
    });
    expect(requests.length).toBe(1);
    expect(requests[0].requestId).toBe(request1.requestId);
  });

  it('can create an encrypted request and get it back unencrypted', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider, decryptionProvider });
    const timestamp = Date.now();

    // Create an encrypted request
    const request = await requestNetwork._createEncryptedRequest(
      {
        requestInfo: {
          ...requestCreationHashBTC,
          ...{ timestamp },
        },
        signer: payeeIdentity,
      },
      [encryptionData.encryptionParams],
    );

    // Check that a request was returned
    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();

    // Get the data
    const requestData = request.getData();
    expect(requestData).toBeDefined();
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.PENDING);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

    // Fetch the created request by its id
    const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);

    // Verify that the request values are correct
    expect(fetchedRequest).toBeInstanceOf(Request);

    const fetchedRequestData = fetchedRequest.getData();
    expect(requestData.expectedAmount).toBe(fetchedRequestData.expectedAmount);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');
  });

  it('can create an encrypted request, modify it and get it back unencrypted', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider, decryptionProvider });
    const timestamp = Date.now();

    // Create an encrypted request
    const request = await requestNetwork._createEncryptedRequest(
      {
        requestInfo: {
          ...requestCreationHashBTC,
          ...{ timestamp },
        },
        signer: payeeIdentity,
      },
      [encryptionData.encryptionParams],
    );

    // Check that a request was returned
    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();

    // Get the data
    const requestData = request.getData();
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.PENDING);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.meta!.transactionManagerMeta.encryptionMethod).toBe('ecies-aes256-gcm');

    await new Promise((resolve): any => request.on('confirmed', resolve));

    // Fetch the created request by its id
    const fetchedRequest = await requestNetwork.fromRequestId(request.requestId);

    // Verify that the request values are correct
    expect(fetchedRequest).toBeInstanceOf(Request);
    expect(fetchedRequest.requestId).toBeDefined();
    expect(fetchedRequest.requestId).toBe(request.requestId);

    let fetchedRequestData = fetchedRequest.getData();
    expect(fetchedRequestData.expectedAmount).toBe(requestData.expectedAmount);
    expect(fetchedRequestData.balance).toBe(null);
    expect(fetchedRequestData.meta).toBeDefined();
    expect(fetchedRequestData.meta!.transactionManagerMeta.encryptionMethod).toEqual(
      'ecies-aes256-gcm',
    );
    expect(fetchedRequestData.state).toBe(Types.RequestLogic.STATE.CREATED);

    await request.accept(payerIdentity);

    await fetchedRequest.refresh();
    fetchedRequestData = fetchedRequest.getData();
    expect(fetchedRequestData.state).toBe(Types.RequestLogic.STATE.ACCEPTED);

    await request.increaseExpectedAmountRequest(
      requestCreationHashBTC.expectedAmount,
      payerIdentity,
    );

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toEqual(
      String(Number(requestCreationHashBTC.expectedAmount) * 2),
    );

    await request.reduceExpectedAmountRequest(
      Number(requestCreationHashBTC.expectedAmount) * 2,
      payeeIdentity,
    );

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toBe('0');
  });

  it('create an encrypted and unencrypted request with the same content', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider, decryptionProvider });

    const timestamp = Date.now();

    // Create an encrypted request
    const encryptedRequest = await requestNetwork._createEncryptedRequest(
      {
        requestInfo: {
          ...requestCreationHashBTC,
          ...{ timestamp },
        },
        signer: payeeIdentity,
      },
      [encryptionData.encryptionParams],
    );

    // Create a plain request
    const plainRequest = await requestNetwork.createRequest({
      requestInfo: {
        ...requestCreationHashBTC,
        ...{ timestamp },
      },
      signer: payeeIdentity,
    });
    expect(encryptedRequest.requestId).toBe(plainRequest.requestId);

    const encryptedRequestData = encryptedRequest.getData();
    const plainRequestData = plainRequest.getData();

    expect(encryptedRequestData).not.toEqual(plainRequestData);

    expect(plainRequestData.meta!.transactionManagerMeta!.encryptionMethod).toBe(
      'ecies-aes256-gcm',
    );
    expect(plainRequestData.meta!.transactionManagerMeta.ignoredTransactions![0]).toBeNull();
    expect(plainRequestData.meta!.transactionManagerMeta.ignoredTransactions![1].reason).toBe(
      'Clear transactions are not allowed in encrypted channel',
    );
  });

  it('cannot decrypt a request with the wrong decryption provider', async () => {
    const timestamp = Date.now();
    const myRandomTopic = `topic ${Utils.getCurrentTimestampInSecond()}`;
    const requestNetwork = new RequestNetwork({
      decryptionProvider,
      signatureProvider,
    });

    const badRequestNetwork = new RequestNetwork({
      decryptionProvider: wrongDecryptionProvider,
      signatureProvider,
    });

    const request = await requestNetwork._createEncryptedRequest(
      {
        requestInfo: {
          ...requestCreationHashBTC,
          ...{ timestamp },
        },
        signer: payeeIdentity,
        topics: [myRandomTopic],
      },
      [encryptionData.encryptionParams],
    );

    // console.log(JSON.stringify(await badRequestNetwork.fromRequestId(request.requestId)));
    await expect(badRequestNetwork.fromRequestId(request.requestId)).rejects.toThrowError(
      'Invalid transaction(s) found: [',
    );
    const requests = await badRequestNetwork.fromTopic(myRandomTopic);
    expect(requests).toHaveLength(0);
  });
});

describe('ERC20 localhost request creation and detection test', () => {
  const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
    id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
    parameters: {
      paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
    },
  };

  const contractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

  const erc20requestCreationHash: Types.IRequestInfo = {
    currency: {
      network: 'private',
      type: Types.RequestLogic.CURRENCY.ERC20,
      value: contractAddress,
    },
    expectedAmount: '10',
    payee: payeeIdentity,
    payer: payerIdentity,
  };

  it('can create an ERC20 request on localhost and detect the payment using address based detection', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: erc20requestCreationHash,
      signer: payeeIdentity,
    });

    expect(request).toBeInstanceOf(Request);
    expect(request.requestId).toBeDefined();

    // Get the data
    let requestData = request.getData();
    expect(requestData.expectedAmount).toBe('10');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.PENDING);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.state).toBe(Types.RequestLogic.STATE.CREATED);

    requestData = await new Promise((resolve): any => request.on('confirmed', resolve));
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();
  });
});
