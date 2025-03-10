/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import * as MultiFormat from '@requestnetwork/multi-format';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
import {
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
  ExtensionTypes,
  CurrencyTypes,
} from '@requestnetwork/types';
import {
  payRequest,
  approveErc20ForProxyConversionIfNeeded,
  encodeRequestErc20Approval,
  encodeRequestPayment,
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
import { getCurrentTimestampInSecond, normalizeKeccak256Hash } from '@requestnetwork/utils';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

// eslint-disable-next-line no-magic-numbers
jest.setTimeout(30000);

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
    key: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: Types.Encryption.METHOD.ECIES,
  },
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

// Currencies and Currency Manager
const tokenContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const localDai = {
  type: Types.RequestLogic.CURRENCY.ERC20,
  value: tokenContractAddress,
  network: 'private' as CurrencyTypes.ChainName,
};
const localEth = {
  type: Types.RequestLogic.CURRENCY.ETH,
  value: 'ETH',
  network: 'private' as CurrencyTypes.ChainName,
};

const currencies: CurrencyTypes.CurrencyInput[] = [
  ...CurrencyManager.getDefaultList(),
  {
    network: 'private',
    symbol: 'ETH',
    decimals: 18,
    type: RequestLogicTypes.CURRENCY.ETH,
  },
  {
    address: tokenContractAddress,
    decimals: 18,
    network: 'private',
    symbol: 'localDAI',
    type: RequestLogicTypes.CURRENCY.ERC20,
  },
];
const currencyManager = new CurrencyManager(currencies);

// Decryption provider setup
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
  encryptionData.decryptionParams,
);

// Wrong decryption provider
const wrongDecryptionProvider = new EthereumPrivateKeyDecryptionProvider({
  key: '0x0000000000111111111122222222223333333333444444444455555555556666',
  method: Types.Encryption.METHOD.ECIES,
});

const waitForConfirmation = async (input: Request | Types.IRequestDataWithEvents) => {
  // Create the promise to wait for confirmation.
  const waitForConfirmationPromise = new Promise<Types.IRequestDataWithEvents>((resolve) =>
    input.on('confirmed', resolve),
  );

  // In parallel, mine an empty block, because a confirmation needs to wait for two blocks
  // (the block that persisted the action + another block).
  const mineBlockPromise = provider.send('evm_mine', []);

  // Set a time limit to wait for confirmation before throwing.
  // Create the error object right away to conserve the context's stacktrace.
  const timeoutError = new Error('waiting for confirmation took too long');
  const timeout = setTimeout(() => {
    throw timeoutError;
  }, 5000);

  // Return the confirmation result.
  const [requestData] = await Promise.all([waitForConfirmationPromise, mineBlockPromise]);
  clearTimeout(timeout);
  return requestData;
};

describe('Request client using a request node', () => {
  it('can create a request, change the amount and get data', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
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

    requestData = await waitForConfirmation(request);
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();

    // Reduce the amount and get the data
    requestData = await request.reduceExpectedAmountRequest('200', payeeIdentity);
    expect(requestData.expectedAmount).toBe('1000');
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.balance).toBeNull();
    expect(requestData.meta).toBeDefined();
    expect(requestData.pending!.expectedAmount).toBe('800');

    requestData = await waitForConfirmation(requestData);
    expect(requestData.expectedAmount).toBe('800');
    expect(requestData.pending).toBeNull();
  });

  it('can create a request with declarative payment network and content data', async () => {
    const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
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

    const extension = requestData.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE];
    expect(extension).toBeDefined();
    expect(extension.events[0].name).toBe('create');
    expect(extension.events[0].parameters).toEqual(paymentNetwork.parameters);

    requestData = await waitForConfirmation(request);
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();

    requestData = await request.declareSentPayment('100', 'bank transfer initiated', payerIdentity);
    expect(requestData.balance).toBeDefined();
    expect(requestData.balance!.balance).toBe('0');

    requestData = await waitForConfirmation(requestData);
    expect(requestData.balance!.balance).toBe('0');

    requestData = await request.declareReceivedPayment(
      '100',
      'bank transfer received',
      payeeIdentity,
    );
    expect(requestData.balance).toBeDefined();
    expect(requestData.balance!.balance).toBe('0');

    requestData = await waitForConfirmation(requestData);
    expect(requestData.balance!.balance).toBe('100');
  });

  it('can create requests and get them fromIdentity and with time boundaries', async () => {
    // create request 1
    const requestCreationHash1: Types.IRequestInfo = {
      currency: 'USD',
      expectedAmount: '100000000',
      payee: payeeIdentity,
      payer: payerIdentity,
      timestamp: getCurrentTimestampInSecond(),
    };

    const topicsRequest1and2: string[] = [
      MultiFormat.serialize(normalizeKeccak256Hash(requestCreationHash1)),
    ];

    const request1: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash1,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });
    const confirmedRequest = await request1.waitForConfirmation();
    expect(confirmedRequest.state).toBe('created');

    const timestampBeforeReduce = getCurrentTimestampInSecond();

    // make sure that request 2 timestamp is greater than request 1 timestamp
    const waitNextSecond = (timestampBeforeReduce + 1) * 1000 - Date.now();
    await new Promise((r) => setTimeout(r, waitNextSecond));

    // create request 2
    const requestCreationHash2: Types.IRequestInfo = {
      currency: 'USD',
      expectedAmount: '1000',
      payee: payeeIdentity,
      payer: payerIdentity,
      timestamp: getCurrentTimestampInSecond(),
    };

    const request2: Request = await requestNetwork.createRequest({
      requestInfo: requestCreationHash2,
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    const confirmedRequest2 = await waitForConfirmation(request2);
    expect(confirmedRequest2.state).toBe('created');

    // reduce request 1
    const requestDataReduce = await request1.reduceExpectedAmountRequest('10000000', payeeIdentity);
    await waitForConfirmation(requestDataReduce);

    // cancel request 1
    const requestDataCancel = await request1.cancel(payeeIdentity);
    await waitForConfirmation(requestDataCancel);

    // get requests without boundaries
    const response = await requestNetwork.fromTopic(topicsRequest1and2[0]);
    let requests = Array.isArray(response) ? response : response.requests;
    expect(requests.length).toBe(2);
    expect(requests[0].requestId).toBe(request1.requestId);
    expect(requests[1].requestId).toBe(request2.requestId);

    let requestData1 = requests[0].getData();
    expect(requestData1.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestData1.expectedAmount).toBe('90000000');

    const requestData2 = requests[1].getData();
    expect(requestData2.state).toBe(Types.RequestLogic.STATE.CREATED);

    // get requests with boundaries
    const result = await requestNetwork.fromTopic(topicsRequest1and2[0], {
      to: timestampBeforeReduce,
    });
    requests = Array.isArray(result) ? result : result.requests;
    expect(requests.length).toBe(1);
    expect(requests[0].requestId).toBe(request1.requestId);

    requestData1 = requests[0].getData();
    expect(requestData1.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestData1.expectedAmount).toBe('90000000');
  }, 20000);

  it('can create requests and get them fromIdentity with smart contract identity', async () => {
    const payerSmartContract = {
      network: 'private',
      type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
      value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
    };

    const timestampCreation = getCurrentTimestampInSecond();

    // create request 1
    const topicsRequest1and2: string[] = [
      MultiFormat.serialize(normalizeKeccak256Hash(timestampCreation)),
    ];
    const request1: Request = await requestNetwork.createRequest({
      requestInfo: {
        currency: 'USD',
        expectedAmount: '100000000',
        payee: payeeIdentity,
        payer: payerSmartContract,
        timestamp: getCurrentTimestampInSecond(),
      },
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // create request 2 to be sure it is not found when search with smart contract identity
    await requestNetwork.createRequest({
      requestInfo: {
        currency: 'USD',
        expectedAmount: '1000',
        payee: payeeIdentity,
        payer: payerIdentity,
        timestamp: getCurrentTimestampInSecond(),
      },
      signer: payeeIdentity,
      topics: topicsRequest1and2,
    });

    // wait 1,5 sec and store the timestamp
    /* eslint-disable no-magic-numbers */
    // eslint-disable-next-line
    await new Promise((r) => setTimeout(r, 1500));

    // get requests with boundaries
    const result = await requestNetwork.fromIdentity(payerSmartContract, {
      from: timestampCreation,
    });
    const requests = Array.isArray(result) ? result : result.requests;
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
          ...requestCreationHashUSD,
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
          ...requestCreationHashUSD,
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

    const confirmedRequest = await waitForConfirmation(request);
    expect(confirmedRequest.state).toBe(Types.RequestLogic.STATE.CREATED);

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
    await waitForConfirmation(acceptData);

    await fetchedRequest.refresh();
    fetchedRequestData = fetchedRequest.getData();
    expect(fetchedRequestData.state).toBe(Types.RequestLogic.STATE.ACCEPTED);

    const increaseData = await request.increaseExpectedAmountRequest(
      requestCreationHashUSD.expectedAmount,
      payerIdentity,
    );
    await waitForConfirmation(increaseData);

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toEqual(
      String(Number(requestCreationHashUSD.expectedAmount) * 2),
    );

    const reduceData = await request.reduceExpectedAmountRequest(
      Number(requestCreationHashUSD.expectedAmount) * 2,
      payeeIdentity,
    );
    await waitForConfirmation(reduceData);

    await fetchedRequest.refresh();
    expect(fetchedRequest.getData().expectedAmount).toBe('0');
  }, 60000);

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
          ...requestCreationHashUSD,
          ...{ timestamp },
        },
        signer: payeeIdentity,
      },
      [encryptionData.encryptionParams],
    );
    await waitForConfirmation(encryptedRequest);

    // Create a plain request
    const plainRequest = await requestNetwork.createRequest({
      requestInfo: {
        ...requestCreationHashUSD,
        ...{ timestamp },
      },
      signer: payeeIdentity,
    });
    expect(encryptedRequest.requestId).toBe(plainRequest.requestId);

    const encryptedRequestData = encryptedRequest.getData();
    const plainRequestData = plainRequest.getData();

    expect(encryptedRequestData).not.toEqual(plainRequestData);

    expect(encryptedRequestData.meta!.transactionManagerMeta!.encryptionMethod).toBe(
      'ecies-aes256-gcm',
    );
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
    const myRandomTopic = `topic ${getCurrentTimestampInSecond()}`;
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
          ...requestCreationHashUSD,
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
  const paymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
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

    requestData = await waitForConfirmation(request);
    expect(requestData.state).toBe(Types.RequestLogic.STATE.CREATED);
    expect(requestData.pending).toBeNull();
  });

  it('can create ERC20 requests with any to erc20 proxy', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencyManager,
    });

    const paymentNetworkAnyToERC20: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
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
    });

    let data = await request.refresh();
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
      currency: localDai,
      maxToSpend,
      currencyManager,
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

  it('can create ETH requests and pay with ETH Fee proxy and cancel after paid', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencyManager,
    });

    const paymentNetworkETHFeeProxy: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      parameters: {
        paymentAddress: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
        feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        feeAmount: '200',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork: paymentNetworkETHFeeProxy,
      requestInfo: ethRequestCreationHash,
      signer: payeeIdentity,
    });

    let data = await request.refresh();

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

    // Cancel the request
    const requestDataCancel = await request.cancel(payeeIdentity);
    const requestDataCancelConfirmed = await waitForConfirmation(requestDataCancel);
    expect(requestDataCancelConfirmed.state).toBe(Types.RequestLogic.STATE.CANCELED);
    expect(requestDataCancelConfirmed.balance?.balance).toBe('1000');
  });

  it('can create & pay a request with any to eth proxy', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencyManager,
    });

    const paymentNetworkAnyToETH: PaymentTypes.PaymentNetworkCreateParameters = {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
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
      currencyManager,
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

describe('Localhost Meta request creation and detection test', () => {
  const anyToErc20Salt = 'ea3bc7caf64110cb';
  const anyToEthSalt = 'ea3bc7caf64110ca';
  const anyToErc20PaymentAddress = '0xfA9154CAA55c83a6941696785B1cae6386611721';
  const anyToEthPaymentAddress = '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB';
  const metaPaymentNetworkParameters: PaymentTypes.PaymentNetworkCreateParameters = {
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    parameters: {
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: [
        {
          paymentAddress: anyToEthPaymentAddress,
          feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
          feeAmount: '200',
          network: 'private',
          salt: anyToEthSalt,
        },
      ],
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
        {
          paymentAddress: anyToErc20PaymentAddress,
          refundAddress: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
          feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
          feeAmount: '100',
          network: 'private',
          acceptedTokens: [tokenContractAddress],
          maxRateTimespan: 1000000,
          salt: anyToErc20Salt,
        },
      ],
    },
  };

  it('can create meta-pn requests and pay with any-to-erc20', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencyManager,
    });

    const request = await requestNetwork.createRequest({
      paymentNetwork: metaPaymentNetworkParameters,
      requestInfo: requestCreationHashUSD,
      signer: payeeIdentity,
    });

    let data = await request.refresh();

    const maxToSpend = BigNumber.from(2).pow(255);
    const settings = {
      conversion: {
        maxToSpend,
        currencyManager,
        currency: localDai,
      },
      pnIdentifier: anyToErc20Salt,
    };

    const approvalTx = encodeRequestErc20Approval(data, provider, settings);
    if (approvalTx) {
      await wallet.sendTransaction(approvalTx);
    }

    const paymentTx = await encodeRequestPayment(data, provider, settings);
    await wallet.sendTransaction(paymentTx);

    data = await request.refresh();
    expect(data.balance?.error).toBeUndefined();
    expect(data.balance?.balance).toBe('1000');
    expect(data.balance?.events.length).toBe(1);
    const event = data.balance?.events[0];
    expect(event?.amount).toBe('1000');
    expect(event?.name).toBe('payment');

    expect(event?.parameters?.feeAmount).toBe('100');
    expect(event?.parameters?.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');
    expect(event?.parameters?.to).toBe(anyToErc20PaymentAddress);
  });

  it('can create meta-pn requests and pay with any-to-eth', async () => {
    const requestNetwork = new RequestNetwork({
      signatureProvider,
      useMockStorage: true,
      currencyManager,
    });

    const request = await requestNetwork.createRequest({
      paymentNetwork: metaPaymentNetworkParameters,
      requestInfo: requestCreationHashUSD,
      signer: payeeIdentity,
    });

    let data = await request.refresh();

    const maxToSpend = '30000000000000000';
    const settings = {
      conversion: {
        maxToSpend,
        currencyManager,
        currency: localEth,
      },
      pnIdentifier: anyToEthSalt,
    };

    const paymentTx = await encodeRequestPayment(data, provider, settings);
    await wallet.sendTransaction(paymentTx);

    data = await request.refresh();
    expect(data.balance?.error).toBeUndefined();
    expect(data.balance?.balance).toBe('1000');
    expect(data.balance?.events.length).toBe(1);
    const event = data.balance?.events[0];
    expect(event?.amount).toBe('1000');
    expect(event?.name).toBe('payment');

    expect(event?.parameters?.feeAmount).toBe('200');
    expect(event?.parameters?.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');
    expect(event?.parameters?.to).toBe(anyToEthPaymentAddress);
  });
});
