import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import MultiFormat from '@requestnetwork/multi-format';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
import { IdentityTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import {
  payRequest,
  approveErc20ForProxyConversionIfNeeded,
} from '@requestnetwork/payment-processor';
import { CurrencyManager } from '@requestnetwork/currency';

import { Wallet, providers, BigNumber } from 'ethers';
import {
  erc20requestCreationHash,
  httpConfig,
  payeeIdentity,
  payerIdentity,
  requestNetwork,
  signatureProvider,
} from './scheduled/fixtures';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

// eslint-disable-next-line no-magic-numbers
jest.setTimeout(10000);

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

describe('Request client using a request node', () => {
  it('can create a request, change the amount and get data', async () => {
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

  it('can create a request with declarative payment network and content data', async () => {
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

    requestData = await request.declareSentPayment('100', 'bank transfer initiated', payerIdentity);
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
    await request1.waitForConfirmation();
    const timestampBeforeReduce = Utils.getCurrentTimestampInSecond();

    // make sure that request 2 timestamp is greater than request 1 timestamp
    const waitNextSecond = (timestampBeforeReduce + 1) * 1000 - Date.now();
    await new Promise((r) => setTimeout(r, waitNextSecond));

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
    await request2.waitForConfirmation();

    // reduce request 1
    const requestDataReduce = await request1.reduceExpectedAmountRequest('10000000', payeeIdentity);
    await new Promise((r) => requestDataReduce.on('confirmed', r));

    // cancel request 1
    const requestDataCancel = await request1.cancel(payeeIdentity);
    await new Promise((r) => requestDataCancel.on('confirmed', r));

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
      to: timestampBeforeReduce,
    });
    expect(requests.length).toBe(1);
    expect(requests[0].requestId).toBe(request1.requestId);

    requestData1 = requests[0].getData();
    expect(requestData1.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestData1.expectedAmount).toBe('90000000');
  });

  it('can create requests and get them fromIdentity with smart contract identity', async () => {
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
    /* eslint-disable no-magic-numbers */
    // eslint-disable-next-line
    await new Promise((r) => setTimeout(r, 1500));

    // get requests with boundaries
    const requests = await requestNetwork.fromIdentity(payerSmartContract, {
      from: timestampCreation,
    });
    expect(requests.length).toBe(1);
    expect(requests[0].requestId).toBe(request1.requestId);
  });

  it('can create an encrypted request and get it back unencrypted', async () => {
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider,
      decryptionProvider,
    });
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
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider,
      decryptionProvider,
    });
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

    await new Promise((resolve) => request.on('confirmed', resolve));

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

    const acceptData = await request.accept(payerIdentity);
    await new Promise((resolve) => acceptData.on('confirmed', resolve));

    await fetchedRequest.refresh();
    fetchedRequestData = fetchedRequest.getData();
    expect(fetchedRequestData.state).toBe(Types.RequestLogic.STATE.ACCEPTED);

    const increaseData = await request.increaseExpectedAmountRequest(
      requestCreationHashBTC.expectedAmount,
      payerIdentity,
    );
    await new Promise((resolve) => increaseData.on('confirmed', resolve));

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toEqual(
      String(Number(requestCreationHashBTC.expectedAmount) * 2),
    );

    const reduceData = await request.reduceExpectedAmountRequest(
      Number(requestCreationHashBTC.expectedAmount) * 2,
      payeeIdentity,
    );
    await new Promise((resolve) => reduceData.on('confirmed', resolve));

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toBe('0');
  });

  it('create an encrypted and unencrypted request with the same content', async () => {
    const requestNetwork = new RequestNetwork({
      httpConfig,
      signatureProvider,
      decryptionProvider,
    });

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
      httpConfig,
      decryptionProvider,
      signatureProvider,
    });

    const badRequestNetwork = new RequestNetwork({
      httpConfig,
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

  it('can create an ERC20 request on localhost', async () => {
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

  it('can create ERC20 requests with any to erc20 proxy', async () => {
    const tokenContractAddress = '0x38cf23c52bb4b13f051aec09580a2de845a7fa35';

    const currencies = [
      ...CurrencyManager.getDefaultList(),
      {
        address: tokenContractAddress,
        decimals: 18,
        network: 'private',
        symbol: 'localDAI',
        type: RequestLogicTypes.CURRENCY.ERC20,
      },
    ];
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencies,
    });

    const paymentNetworkAnyToERC20: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      parameters: {
        paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        refundAddress: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
        feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        feeAmount: '200',
        network: 'private',
        acceptedTokens: [tokenContractAddress],
        maxRateTimespan: 1000000,
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork: paymentNetworkAnyToERC20,
      requestInfo: requestCreationHashUSD,
      signer: payeeIdentity,
      disablePaymentDetection: true,
    });

    let data = await request.refresh();
    expect(data.balance).toBeNull();
    const approval = await approveErc20ForProxyConversionIfNeeded(
      data,
      payeeIdentity.value,
      tokenContractAddress,
      wallet,
      '100000000000000000000000000000000000',
    );
    if (approval) {
      await approval.wait();
    }

    // USD => token
    const maxToSpend = BigNumber.from(2).pow(255);
    const paymentTx = await payRequest(data, wallet, undefined, undefined, {
      currency: {
        type: Types.RequestLogic.CURRENCY.ERC20,
        value: tokenContractAddress,
        network: 'private',
      },
      maxToSpend,
      currencyManager: new CurrencyManager(currencies),
    });
    await paymentTx.wait();

    data = await request.refresh();

    expect(data.balance?.balance).toBe('1000');
    expect(data.balance?.events.length).toBe(1);
    const event = data.balance?.events[0];
    expect(event?.amount).toBe('1000');
    expect(event?.name).toBe('payment');

    expect(event?.parameters?.feeAmount).toBe('200');
    expect(event?.parameters?.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');
    // amount in crypto after apply the rates of the fake aggregators
    expect(event?.parameters?.feeAmountInCrypto).toBe('1980198019801980198');
    expect(event?.parameters?.to).toBe('0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB');
    expect(event?.parameters?.tokenAddress).toBe('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
    // amount in crypto after apply the rates of the fake aggregators
    expect(event?.parameters?.amountInCrypto).toBe('9900990099009900990');
    expect(event?.parameters?.maxRateTimespan).toBe('1000000');
  });
});

describe('ETH localhost request creation and detection test', () => {
  const ethRequestCreationHash: Types.IRequestInfo = {
    currency: {
      network: 'private',
      type: Types.RequestLogic.CURRENCY.ETH,
      value: Types.RequestLogic.CURRENCY.ETH,
    },
    expectedAmount: '1000',
    payee: payeeIdentity,
    payer: payerIdentity,
  };

  it('can create ETH requests and pay with ETH Fee proxy', async () => {
    const currencies = [...CurrencyManager.getDefaultList()];
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencies,
    });

    const paymentNetworkETHFeeProxy: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      parameters: {
        paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        feeAmount: '200',
        network: 'private',
        maxRateTimespan: 1000000,
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork: paymentNetworkETHFeeProxy,
      requestInfo: ethRequestCreationHash,
      signer: payeeIdentity,
      disablePaymentDetection: true,
    });

    let data = await request.refresh();
    expect(data.balance).toBeNull();

    const paymentTx = await payRequest(data, wallet);
    await paymentTx.wait();

    data = await request.refresh();
    expect(data.balance?.error).toBeUndefined();
    expect(data.balance?.balance).toBe('1000');
    expect(data.balance?.events.length).toBe(1);
    const event = data.balance?.events[0];
    expect(event?.amount).toBe('1000');
    expect(event?.name).toBe('payment');

    expect(event?.parameters?.feeAmount).toBe('200');
    expect(event?.parameters?.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');
    // amount in crypto after apply the rates of the fake aggregators
    expect(event?.parameters?.to).toBe('0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB');
  });

  it('can create & pay a request with any to eth proxy', async () => {
    const currencies = [
      ...CurrencyManager.getDefaultList(),
      ...[
        {
          network: 'private',
          symbol: 'ETH',
          decimals: 18,
          type: RequestLogicTypes.CURRENCY.ETH as any,
        },
      ],
    ];

    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencies,
    });

    const paymentNetworkAnyToETH: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
      parameters: {
        paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        refundAddress: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
        feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        feeAmount: '200',
        network: 'private',
        maxRateTimespan: 1000000,
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork: paymentNetworkAnyToETH,
      requestInfo: requestCreationHashUSD,
      signer: payeeIdentity,
    });

    let data = await request.refresh();

    // USD => ETH
    const maxToSpend = '30000000000000000';
    const paymentTx = await payRequest(data, wallet, undefined, undefined, {
      maxToSpend,
      currencyManager: new CurrencyManager(currencies),
    });

    await paymentTx.wait();

    data = await request.refresh();

    expect(data.balance?.balance).toBe('1000');
    expect(data.balance?.events.length).toBe(1);
    const event = data.balance?.events[0];
    expect(event?.amount).toBe('1000');
    expect(event?.name).toBe('payment');

    expect(event?.parameters?.feeAmount).toBe('200');
    expect(event?.parameters?.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');
    // amount in crypto after apply the rates of the fake aggregators
    //   expectedAmount:       10.00
    //   AggETHUsd.sol       /   500
    //                       =  0.02 (over 18 decimals for this ETH)
    expect(event?.parameters?.amountInCrypto).toBe('20000000000000000');
    // amount in crypto after apply the rates of the fake aggregators
    //   feesAmount:            2.00
    //   AggETHUsd.sol       /   500
    //                       =  0.004 (over 18 decimals for this ETH)
    expect(event?.parameters?.feeAmountInCrypto).toBe('4000000000000000');
    expect(event?.parameters?.to).toBe('0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB');
    // amount in crypto after apply the rates of the fake aggregators
    expect(event?.parameters?.maxRateTimespan).toBe('1000000');
  });
});
