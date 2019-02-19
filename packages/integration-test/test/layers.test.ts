import { assert } from 'chai';
import 'mocha';
const web3Eth = require('web3-eth');

import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { EthereumStorage } from '@requestnetwork/ethereum-storage';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogic as AdvancedLogicTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
  Storage as StorageTypes,
} from '@requestnetwork/types';

let advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
let requestLogic: RequestLogicTypes.IRequestLogic;
let provider: any;
let signatureInfo: SignatureTypes.ISignatureParameters;
let signerIdentity: IdentityTypes.IIdentity;

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

    // Transaction manager setup
    const transactionManager = new TransactionManager(dataAccess);

    // Signature provider setup
    signatureInfo = {
      method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    };
    signerIdentity = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
    };
    const signatureProvider = new EthereumPrivateKeySignatureProvider(signatureInfo);

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

    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.ETH,
      expectedAmount: '100000000000',
      extensionsData: [contentDataExtensionData],
      payee: signerIdentity,
      payer: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
    };

    const topics = [
      '0x627306090abab3a6e1400e9345bc60c78a8bef57',
      '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
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

    const request = await requestLogic.getRequestById(resultCreation.result.requestId);

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
    const requestCreationHash: RequestLogicTypes.ICreateParameters = {
      currency: RequestLogicTypes.CURRENCY.BTC,
      expectedAmount: '100000000000',
      extensionsData: [pnBTCExtensionData, contentDataExtensionData],
      payee: signerIdentity,
      payer: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
    };

    const topics = [
      '0x627306090abab3a6e1400e9345bc60c78a8bef57',
      '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
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

    const request = await requestLogic.getRequestById(resultCreation.result.requestId);

    assert.exists(request);
  });
});
