const web3Eth = require('web3-eth');

import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { EthereumStorage } from '@requestnetwork/ethereum-storage';
import MultiFormat from '@requestnetwork/multi-format';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogicTypes,
  DataAccessTypes,
  EncryptionTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureTypes,
  StorageTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

let advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
let requestLogic: RequestLogicTypes.IRequestLogic;
let provider: any;
let payeeSignatureInfo: SignatureTypes.ISignatureParameters;
let payeeIdentity: IdentityTypes.IIdentity;
let encryptionDataPayee: any;
let payerSignatureInfo: SignatureTypes.ISignatureParameters;
let payerIdentity: IdentityTypes.IIdentity;
let encryptionDataPayer: any;
let decryptionProvider: any;
let signatureProvider: any;

let dataAccess: DataAccessTypes.IDataAccess;

const { time } = require('@openzeppelin/test-helpers');

let nbBlocks = 0;
let testsFinished = false;
const interval = setInterval(async () => {
  await time.advanceBlock();
  if (testsFinished) {
    nbBlocks++;
  }
  // tslint:disable-next-line: no-magic-numbers
  if (nbBlocks > 25) {
    clearInterval(interval);
  }
  // tslint:disable-next-line: no-magic-numbers
}, 1000);

afterAll(() => {
  testsFinished = true;
});

describe('Request system', () => {
  beforeEach(async () => {
    // Storage setup
    provider = new web3Eth.providers.HttpProvider('http://localhost:8545');
    const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
      host: 'localhost',
      port: 5001,
      protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
      timeout: 10000,
    };
    const web3Connection: StorageTypes.IWeb3Connection = {
      networkId: StorageTypes.EthereumNetwork.PRIVATE,
      web3Provider: provider,
    };
    const ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);

    // Data access setup
    dataAccess = new DataAccess(ethereumStorage);
    await dataAccess.initialize();

    // Signature provider setup
    payeeSignatureInfo = {
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    };
    payeeIdentity = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
    };
    payerSignatureInfo = {
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
    };
    payerIdentity = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
    };

    signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);
    signatureProvider.addSignatureParameters(payerSignatureInfo);

    encryptionDataPayee = {
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
        value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
      },
      privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
      publicKey:
        '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    };
    encryptionDataPayer = {
      decryptionParams: {
        key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
        method: EncryptionTypes.METHOD.ECIES,
      },
      encryptionParams: {
        key:
          '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
        method: EncryptionTypes.METHOD.ECIES,
      },
      identity: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
      privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
      publicKey:
        '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
    };

    // Decryption provider setup
    decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
      encryptionDataPayee.decryptionParams,
    );
    decryptionProvider.addDecryptionParameters(encryptionDataPayer.decryptionParams);

    // Transaction manager setup
    const transactionManager = new TransactionManager(dataAccess, decryptionProvider);

    // Advanced Logic setup
    advancedLogic = new AdvancedLogic();

    // Logic setup
    requestLogic = new RequestLogic(transactionManager, signatureProvider, advancedLogic);
  });

  afterAll(() => {
    // Stop web3 provider
    provider.disconnect();
  });

  it('can create a request', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const payer = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    };

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      expectedAmount: '100000000000',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [payeeIdentity, payer];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    expect(resultCreation).toBeDefined();

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(resultCreation.result.requestId.length).toEqual(requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(request).toBeDefined();
  });

  it('can create a request with smart contract as payer', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const payer = {
      network: 'private',
      type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    };

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      expectedAmount: '100000000000',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [payeeIdentity, payer];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    expect(resultCreation).toBeDefined();

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(resultCreation.result.requestId.length).toEqual(requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(request).toBeDefined();
  });

  it('can create a request with cache', async () => {
    const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
      host: 'localhost',
      port: 5001,
      protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
      timeout: 10000,
    };
    const web3Connection: StorageTypes.IWeb3Connection = {
      networkId: StorageTypes.EthereumNetwork.PRIVATE,
      web3Provider: provider,
    };
    const ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);

    // Data access setup
    dataAccess = new DataAccess(ethereumStorage);
    await dataAccess.initialize();

    // Transaction manager setup
    const transactionManager = new TransactionManager(dataAccess, decryptionProvider);

    // Advanced Logic setup
    advancedLogic = new AdvancedLogic();

    // Logic setup
    requestLogic = new RequestLogic(transactionManager, signatureProvider, advancedLogic);

    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const payer = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    };

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      expectedAmount: '100000000000',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [payeeIdentity, payer];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    expect(resultCreation).toBeDefined();
    expect(
      resultCreation.meta.transactionManagerMeta.dataAccessMeta.storageMeta.storageType,
    ).toEqual(StorageTypes.StorageSystemType.LOCAL);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(resultCreation.result.requestId.length).toEqual(requestIdLength);

    // wait a bit
    // tslint:disable-next-line:no-magic-numbers
    await new Promise((r: any): any => setTimeout(r, 2000));

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);
    expect(request).toBeDefined();
    expect(request.meta.transactionManagerMeta.dataAccessMeta.storageMeta[0].storageType).toEqual(
      StorageTypes.StorageSystemType.ETHEREUM_IPFS,
    );
  });

  it('can create a request BTC with payment network', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const pnBTCExtensionData = advancedLogic.extensions.addressBasedTestnetBtc.createCreationAction(
      {
        // eslint-disable-next-line spellcheck/spell-checker
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    );

    const payer = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    };

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        network: 'testnet',
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      },
      expectedAmount: '100000000000',
      extensionsData: [pnBTCExtensionData, contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [payeeIdentity, payer];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    expect(resultCreation).toBeDefined();

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(resultCreation.result.requestId.length).toEqual(requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(request).toBeDefined();
  });

  it('can create requests and get them fromIdentity and with time boundaries', async () => {
    // create request
    const request1CreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      },
      expectedAmount: '200000000000',
      payee: payeeIdentity,
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    // create a unique topic just to not have collisions in tests
    const topics1 = [request1CreationHash];
    const resultCreation1 = await requestLogic.createRequest(
      request1CreationHash,
      payeeIdentity,
      topics1,
    );
    const requestId1 = resultCreation1.result.requestId;

    // create request 2 must be ignored
    const request2CreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      },
      expectedAmount: '10',
      payee: payeeIdentity,
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    const resultCreation2 = await requestLogic.createRequest(
      request2CreationHash,
      payeeIdentity,
      topics1,
    );
    const requestId2 = resultCreation2.result.requestId;

    // reduce request
    const request1ReduceHash: RequestLogicTypes.IReduceExpectedAmountParameters = {
      deltaAmount: '10000000000',
      requestId: requestId1,
    };

    // wait a bit
    // tslint:disable-next-line:no-magic-numbers
    await new Promise((r: any): any => setTimeout(r, 1000));

    const resultReduce1 = await requestLogic.reduceExpectedAmountRequest(
      request1ReduceHash,
      payeeIdentity,
    );
    const timestampReduce1 =
      resultReduce1.meta.transactionManagerMeta.dataAccessMeta.storageMeta.timestamp;

    // wait a bit
    // tslint:disable-next-line:no-magic-numbers
    await new Promise((r: any): any => setTimeout(r, 1100));

    // cancel request
    const request1CancelHash: RequestLogicTypes.ICancelParameters = {
      requestId: requestId1,
    };
    await requestLogic.cancelRequest(request1CancelHash, payeeIdentity);

    const fromTopic = await requestLogic.getRequestsByTopic(topics1[0]);
    expect(fromTopic.result.requests.length).toEqual(2);
    let request1 = fromTopic.result.requests[0];
    const request2 = fromTopic.result.requests[1];
    expect(request1.request!.requestId).toEqual(requestId1);
    expect(request2.request!.requestId).toEqual(requestId2);

    const fromTopicSecondSearch = await requestLogic.getRequestsByTopic(topics1[0], {
      from: timestampReduce1,
    });
    expect(fromTopicSecondSearch.result.requests.length).toEqual(1);
    request1 = fromTopicSecondSearch.result.requests[0];
    expect(request1.request!.requestId).toEqual(requestId1);
    expect(request1.request!.state).toEqual(RequestLogicTypes.STATE.CANCELED);
    expect(request1.request!.expectedAmount).toEqual('190000000000');
  });

  it('can create and update an encrypted request', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      expectedAmount: '12345678987654321',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer: payerIdentity,
    };

    const topics = [payeeIdentity, payerIdentity];

    const resultCreation = await requestLogic.createEncryptedRequest(
      requestCreationHash,
      payeeIdentity,
      [encryptionDataPayee.encryptionParams, encryptionDataPayer.encryptionParams],
      topics,
    );

    expect(resultCreation).toBeDefined();

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    expect(resultCreation.result.requestId.length).toEqual(requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(request.result).toBeDefined();
    expect(request.meta.transactionManagerMeta.encryptionMethod).toEqual('ecies-aes256-gcm');
    expect(request.result.request).toBeNull();
    expect(request.result.pending).toBeDefined();
    expect(request.result.pending!.expectedAmount).toEqual('12345678987654321');
    expect(request.result.pending!.state).toEqual(RequestLogicTypes.STATE.CREATED);

    // reduce the expected amount by payee
    const resultReduce = await requestLogic.reduceExpectedAmountRequest(
      { requestId: resultCreation.result.requestId, deltaAmount: '987654321' },
      payeeIdentity,
    );

    expect(resultReduce.meta.transactionManagerMeta.encryptionMethod).toEqual('ecies-aes256-gcm');
    expect(resultReduce.result).not.toBeDefined();

    const requestAfterReduce = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(requestAfterReduce.result).toBeDefined();
    expect(requestAfterReduce.meta.transactionManagerMeta.encryptionMethod).toEqual(
      'ecies-aes256-gcm',
    );
    expect(requestAfterReduce.result.request).toBeDefined();
    expect(requestAfterReduce.result.request!.expectedAmount).toEqual('12345678987654321');
    expect(requestAfterReduce.result.request!.state).toEqual('created');

    expect(requestAfterReduce.result.pending).toBeDefined();
    expect(requestAfterReduce.result.pending!.expectedAmount).toEqual('12345678000000000');

    // accept the request by payer
    const resultAccept = await requestLogic.acceptRequest(
      { requestId: resultCreation.result.requestId },
      payerIdentity,
    );

    expect(resultAccept.meta.transactionManagerMeta.encryptionMethod).toEqual('ecies-aes256-gcm');
    expect(resultAccept.result).not.toBeDefined();

    const requestAfterAccept = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(requestAfterAccept.result).toBeDefined();
    expect(requestAfterAccept.meta.transactionManagerMeta.encryptionMethod).toEqual(
      'ecies-aes256-gcm',
    );
    expect(requestAfterAccept.result.request).toBeDefined();
    expect(requestAfterAccept.result.request!.state).toEqual(RequestLogicTypes.STATE.CREATED);

    expect(requestAfterAccept.result.pending).toBeDefined();
    expect(requestAfterAccept.result.pending!.state).toEqual(RequestLogicTypes.STATE.ACCEPTED);

    // increase amount of the request by payer
    const resultIncrease = await requestLogic.increaseExpectedAmountRequest(
      { requestId: resultCreation.result.requestId, deltaAmount: '111' },
      payerIdentity,
    );

    expect(resultIncrease.meta.transactionManagerMeta.encryptionMethod).toEqual('ecies-aes256-gcm');
    expect(resultIncrease.result).not.toBeDefined();

    const requestAfterIncrease = await requestLogic.getRequestFromId(
      resultCreation.result.requestId,
    );

    expect(requestAfterIncrease.result).toBeDefined();
    expect(requestAfterIncrease.meta.transactionManagerMeta.encryptionMethod).toEqual(
      'ecies-aes256-gcm',
    );
    expect(requestAfterIncrease.result.request).toBeDefined();
    expect(requestAfterIncrease.result.request!.expectedAmount).toEqual('12345678000000000');

    expect(requestAfterIncrease.result.pending).toBeDefined();
    expect(requestAfterIncrease.result.pending!.expectedAmount).toEqual('12345678000000111');

    // cancel the request by payee
    const resultCancel = await requestLogic.cancelRequest(
      { requestId: resultCreation.result.requestId },
      payeeIdentity,
    );

    expect(resultCancel.meta.transactionManagerMeta.encryptionMethod).toEqual('ecies-aes256-gcm');
    expect(resultCancel.result).not.toBeDefined();

    const requestAfterCancel = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    expect(requestAfterCancel.result).toBeDefined();
    expect(requestAfterCancel.meta.transactionManagerMeta.encryptionMethod).toEqual(
      'ecies-aes256-gcm',
    );
    expect(requestAfterCancel.result.request).toBeDefined();
    expect(requestAfterCancel.result.request!.state).toEqual(RequestLogicTypes.STATE.ACCEPTED);

    expect(requestAfterCancel.result.pending).toBeDefined();
    expect(requestAfterCancel.result.pending!.state).toEqual(RequestLogicTypes.STATE.CANCELED);

    // check that the data are encrypted:
    const dataAccessData = await dataAccess.getTransactionsByChannelId(
      resultCreation.result.requestId,
    );

    expect(dataAccessData.result.transactions.length).toEqual(5);

    expect(dataAccessData.result.transactions[0].transaction.encryptedData).toBeDefined();
    expect(dataAccessData.result.transactions[0].transaction.encryptionMethod).toBeDefined();
    expect(dataAccessData.result.transactions[0].transaction.keys).toBeDefined();
    expect(
      dataAccessData.result.transactions[0].transaction.keys![
        MultiFormat.serialize(encryptionDataPayee.identity)
      ],
    ).toBeDefined();
    expect(
      dataAccessData.result.transactions[0].transaction.keys![
        MultiFormat.serialize(encryptionDataPayer.identity)
      ],
    ).toBeDefined();
    expect(dataAccessData.result.transactions[0].transaction.data).not.toBeDefined();

    expect(dataAccessData.result.transactions[1].transaction.encryptedData).toBeDefined();
    expect(dataAccessData.result.transactions[1].transaction.data).not.toBeDefined();

    expect(dataAccessData.result.transactions[2].transaction.encryptedData).toBeDefined();
    expect(dataAccessData.result.transactions[2].transaction.data).not.toBeDefined();

    expect(dataAccessData.result.transactions[3].transaction.encryptedData).toBeDefined();
    expect(dataAccessData.result.transactions[3].transaction.data).not.toBeDefined();

    expect(dataAccessData.result.transactions[4].transaction.encryptedData).toBeDefined();
    expect(dataAccessData.result.transactions[4].transaction.data).not.toBeDefined();
  });
});
