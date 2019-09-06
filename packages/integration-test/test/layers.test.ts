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
let signatureInfo: SignatureTypes.ISignatureParameters;
let signerIdentity: IdentityTypes.IIdentity;
let encryptionData: any;

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
    const dataAccess = new DataAccess(ethereumStorage);
    await dataAccess.initialize();

    // Signature provider setup
    signatureInfo = {
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    };
    signerIdentity = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
    };
    const signatureProvider = new EthereumPrivateKeySignatureProvider(signatureInfo);

    encryptionData = {
      decryptionParams: {
        key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
        method: EncryptionTypes.METHOD.ECIES,
      },
      encryptionParams: {
        key:
          '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
        method: EncryptionTypes.METHOD.ECIES,
      },
      privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
      publicKey:
        '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    };

    // Decryption provider setup
    const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
      encryptionData.decryptionParams,
    );

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
      payee: signerIdentity,
      payer,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(signerIdentity),
      Utils.crypto.normalizeKeccak256Hash(payer),
    ];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      signerIdentity,
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
      payee: signerIdentity,
      payer,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(signerIdentity),
      Utils.crypto.normalizeKeccak256Hash(payer),
    ];

    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      signerIdentity,
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
      payee: signerIdentity,
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
      signerIdentity,
      topics1,
    );
    const requestId1 = resultCreation1.result.requestId;

    // create request 2 must be ignored
    const request2CreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.BTC,
      expectedAmount: '10',
      payee: signerIdentity,
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    };
    const resultCreation2 = await requestLogic.createRequest(
      request2CreationHash,
      signerIdentity,
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
      signerIdentity,
    );
    const timestampReduce1 =
      resultReduce1.meta.transactionManagerMeta.dataAccessMeta.storageMeta.timestamp;

    // cancel request
    const request1CancelHash: RequestLogicTypes.ICancelParameters = {
      requestId: requestId1,
    };
    await requestLogic.cancelRequest(request1CancelHash, signerIdentity);

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

  it('can create an encrypted request', async () => {
    const contentDataExtensionData = advancedLogic.extensions.contentData.createCreationAction({
      content: { this: 'could', be: 'an', invoice: true },
    });

    const payer = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    };

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.ETH,
      expectedAmount: '12345678987654321',
      extensionsData: [contentDataExtensionData],
      payee: signerIdentity,
      payer,
    };

    const topics = [
      Utils.crypto.normalizeKeccak256Hash(signerIdentity),
      Utils.crypto.normalizeKeccak256Hash(payer),
    ];

    const resultCreation = await requestLogic.createEncryptedRequest(
      requestCreationHash,
      signerIdentity,
      [encryptionData.encryptionParams],
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
  });
});
