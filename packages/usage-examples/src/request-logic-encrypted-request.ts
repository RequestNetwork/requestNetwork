import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  SignatureTypes,
  TransactionTypes,
} from '@requestnetwork/types';

import MockStorage from './mock/mock-storage';

const createParams = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  expectedAmount: '170000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  timestamp: 1544426030,
};

const payeeEncryptionParameters: EncryptionTypes.IEncryptionParameters = {
  key:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  method: EncryptionTypes.METHOD.ECIES,
};
const payeeDecryptionParameters: EncryptionTypes.IDecryptionParameters = {
  key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  method: EncryptionTypes.METHOD.ECIES,
};

const payerEncryptionParameters: EncryptionTypes.IEncryptionParameters = {
  key:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: EncryptionTypes.METHOD.ECIES,
};

// A signature provider, for example @requestnetwork/epk-signature
const signatureProvider: SignatureProviderTypes.ISignatureProvider = new EthereumPrivateKeySignatureProvider(
  {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  },
);

// A decryption provider, for example @requestnetwork/epk-decryption
const decryptionProvider: DecryptionProviderTypes.IDecryptionProvider = new EthereumPrivateKeyDecryptionProvider(
  payeeDecryptionParameters,
);

/* tslint:disable:no-console */
(async (): Promise<any> => {
  // Data access setup
  const dataAccess = new DataAccess(new MockStorage());
  await dataAccess.initialize();

  // A transaction manager, for example @requestnetwork/transaction-manager
  const transactionManager: TransactionTypes.ITransactionManager = new TransactionManager(
    dataAccess,
    decryptionProvider,
  );

  const requestLogic = new RequestLogic(transactionManager, signatureProvider);

  const signerIdentity = {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  };

  // optionally, compute the request ID before actually creating it.
  const requestId = await requestLogic.computeRequestId(createParams, signerIdentity);
  console.log(`The request will be created with ID ${requestId}`);

  const { result: resultCreation } = await requestLogic.createEncryptedRequest(
    createParams,
    signerIdentity,
    [payeeEncryptionParameters, payerEncryptionParameters],
  );

  console.log('requestId:', resultCreation.requestId);

  const { result } = await requestLogic.getRequestFromId(resultCreation.requestId);

  return result.request;
})()
  .then(request => {
    console.log(request);
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });
