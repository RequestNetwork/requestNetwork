import { assert } from 'chai';
import 'mocha';
const web3Eth = require('web3-eth');

import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { EthereumStorage } from '@requestnetwork/ethereum-storage';
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

let dataAccess: DataAccessTypes.IDataAccess;

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
    const ethereumStorage = new EthereumStorage(ipfsGatewayConnection, web3Connection);

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

    const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);
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
    const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
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

  after(() => {
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
      currency: RequestLogicTypes.CURRENCY.ETH,
      expectedAmount: '100000000000',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(payeeIdentity),
      Utils.crypto.normalizeKeccak256Hash(payer),
    ];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    assert.exists(resultCreation);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    assert.equal(resultCreation.result.requestId.length, requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(request);
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
      currency: RequestLogicTypes.CURRENCY.BTC,
      expectedAmount: '100000000000',
      extensionsData: [pnBTCExtensionData, contentDataExtensionData],
      payee: payeeIdentity,
      payer,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(payeeIdentity),
      Utils.crypto.normalizeKeccak256Hash(payer),
    ];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      payeeIdentity,
      topics,
    );

    assert.exists(resultCreation);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    assert.equal(resultCreation.result.requestId.length, requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(request);
  });

  it('can create requests and get them fromIdentity and with time boundaries', async () => {
    // create request
    const request1CreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.BTC,
      expectedAmount: '100000000000',
      payee: payeeIdentity,
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    // create a unique topic just to not have collisions in tests
    const topics1 = [Utils.crypto.normalizeKeccak256Hash(request1CreationHash)];
    const resultCreation1 = await requestLogic.createRequest(
      request1CreationHash,
      payeeIdentity,
      topics1,
    );
    const requestId1 = resultCreation1.result.requestId;

    // create request 2 must be ignored
    const request2CreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.BTC,
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
    const resultReduce1 = await requestLogic.reduceExpectedAmountRequest(
      request1ReduceHash,
      payeeIdentity,
    );
    const timestampReduce1 =
      resultReduce1.meta.transactionManagerMeta.dataAccessMeta.storageMeta.timestamp;

    // cancel request
    const request1CancelHash: RequestLogicTypes.ICancelParameters = {
      requestId: requestId1,
    };
    await requestLogic.cancelRequest(request1CancelHash, payeeIdentity);

    const fromTopic = await requestLogic.getRequestsByTopic(topics1[0]);
    assert.equal(fromTopic.result.requests.length, 2);
    let request1 = fromTopic.result.requests[0];
    const request2 = fromTopic.result.requests[1];
    assert.equal(request1.requestId, requestId1);
    assert.equal(request2.requestId, requestId2);

    const fromTopicSecondSearch = await requestLogic.getRequestsByTopic(topics1[0], {
      from: timestampReduce1,
    });
    assert.equal(fromTopicSecondSearch.result.requests.length, 1);
    request1 = fromTopicSecondSearch.result.requests[0];
    assert.equal(request1.requestId, requestId1);
    assert.equal(request1.state, RequestLogicTypes.STATE.CANCELED);
    assert.equal(request1.expectedAmount, '90000000000');
  });

  it('can create and update an encrypted request', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.ETH,
      expectedAmount: '12345678987654321',
      extensionsData: [contentDataExtensionData],
      payee: payeeIdentity,
      payer: payerIdentity,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(payeeIdentity),
      Utils.crypto.normalizeKeccak256Hash(payerIdentity),
    ];

    const resultCreation = await requestLogic.createEncryptedRequest(
      requestCreationHash,
      payeeIdentity,
      [encryptionDataPayee.encryptionParams, encryptionDataPayer.encryptionParams],
      topics,
    );

    assert.exists(resultCreation);

    // Assert on the length to avoid unnecessary maintenance of the test. 66 = 64 char + '0x'
    const requestIdLength = 66;
    assert.equal(resultCreation.result.requestId.length, requestIdLength);

    const request = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(request.result);
    assert.equal(request.meta.transactionManagerMeta.encryptionMethod, 'ecies-aes256-cbc');
    assert.exists(request.result.request);
    assert.equal(request.result.request!.expectedAmount, '12345678987654321');
    assert.equal(request.result.request!.state, 'created');

    // reduce the expected amount by payee
    const resultReduce = await requestLogic.reduceExpectedAmountRequest(
      { requestId: resultCreation.result.requestId, deltaAmount: '987654321' },
      payeeIdentity,
    );

    assert.equal(resultReduce.meta.transactionManagerMeta.encryptionMethod, 'ecies-aes256-cbc');
    assert.isUndefined(resultReduce.result);

    const requestAfterReduce = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(requestAfterReduce.result);
    assert.equal(
      requestAfterReduce.meta.transactionManagerMeta.encryptionMethod,
      'ecies-aes256-cbc',
    );
    assert.exists(requestAfterReduce.result.request);
    assert.equal(requestAfterReduce.result.request!.expectedAmount, '12345678000000000');
    assert.equal(requestAfterReduce.result.request!.state, 'created');

    // accept the request by payer
    const resultAccept = await requestLogic.acceptRequest(
      { requestId: resultCreation.result.requestId },
      payerIdentity,
    );

    assert.equal(resultAccept.meta.transactionManagerMeta.encryptionMethod, 'ecies-aes256-cbc');
    assert.isUndefined(resultAccept.result);

    const requestAfterAccept = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(requestAfterAccept.result);
    assert.equal(
      requestAfterAccept.meta.transactionManagerMeta.encryptionMethod,
      'ecies-aes256-cbc',
    );
    assert.exists(requestAfterAccept.result.request);
    assert.equal(requestAfterAccept.result.request!.state, 'accepted');

    // increase amount of the request by payer
    const resultIncrease = await requestLogic.increaseExpectedAmountRequest(
      { requestId: resultCreation.result.requestId, deltaAmount: '111' },
      payerIdentity,
    );

    assert.equal(resultIncrease.meta.transactionManagerMeta.encryptionMethod, 'ecies-aes256-cbc');
    assert.isUndefined(resultIncrease.result);

    const requestAfterIncrease = await requestLogic.getRequestFromId(
      resultCreation.result.requestId,
    );

    assert.exists(requestAfterIncrease.result);
    assert.equal(
      requestAfterIncrease.meta.transactionManagerMeta.encryptionMethod,
      'ecies-aes256-cbc',
    );
    assert.exists(requestAfterIncrease.result.request);
    assert.equal(requestAfterIncrease.result.request!.expectedAmount, '12345678000000111');

    // cancel the request by payee
    const resultCancel = await requestLogic.cancelRequest(
      { requestId: resultCreation.result.requestId },
      payeeIdentity,
    );

    assert.equal(resultCancel.meta.transactionManagerMeta.encryptionMethod, 'ecies-aes256-cbc');
    assert.isUndefined(resultCancel.result);

    const requestAfterCancel = await requestLogic.getRequestFromId(resultCreation.result.requestId);

    assert.exists(requestAfterCancel.result);
    assert.equal(
      requestAfterCancel.meta.transactionManagerMeta.encryptionMethod,
      'ecies-aes256-cbc',
    );
    assert.exists(requestAfterCancel.result.request);
    assert.equal(requestAfterCancel.result.request!.state, 'canceled');

    // check that the data are encrypted:
    const dataAccessData = await dataAccess.getTransactionsByChannelId(
      resultCreation.result.requestId,
    );

    assert.equal(dataAccessData.result.transactions.length, 5);

    assert.exists(dataAccessData.result.transactions[0].transaction.encryptedData);
    assert.exists(dataAccessData.result.transactions[0].transaction.encryptionMethod);
    assert.exists(dataAccessData.result.transactions[0].transaction.hash);
    assert.exists(dataAccessData.result.transactions[0].transaction.keys);
    assert.exists(
      dataAccessData.result.transactions[0].transaction.keys![
        Utils.multiFormat.formatIdentityEthereumAddress(encryptionDataPayee.identity.value)
      ],
    );
    assert.exists(
      dataAccessData.result.transactions[0].transaction.keys![
        Utils.multiFormat.formatIdentityEthereumAddress(encryptionDataPayer.identity.value)
      ],
    );
    assert.isUndefined(dataAccessData.result.transactions[0].transaction.data);

    assert.exists(dataAccessData.result.transactions[1].transaction.encryptedData);
    assert.exists(dataAccessData.result.transactions[1].transaction.hash);
    assert.isUndefined(dataAccessData.result.transactions[1].transaction.data);

    assert.exists(dataAccessData.result.transactions[2].transaction.encryptedData);
    assert.exists(dataAccessData.result.transactions[2].transaction.hash);
    assert.isUndefined(dataAccessData.result.transactions[2].transaction.data);

    assert.exists(dataAccessData.result.transactions[3].transaction.encryptedData);
    assert.exists(dataAccessData.result.transactions[3].transaction.hash);
    assert.isUndefined(dataAccessData.result.transactions[3].transaction.data);

    assert.exists(dataAccessData.result.transactions[4].transaction.encryptedData);
    assert.exists(dataAccessData.result.transactions[4].transaction.hash);
    assert.isUndefined(dataAccessData.result.transactions[4].transaction.data);
  });
});
