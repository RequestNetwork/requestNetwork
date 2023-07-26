import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import * as RequestNetwork from '@requestnetwork/request-client.js';
import MockStorage from './mock/mock-storage';
import { MockDataAccess } from '@requestnetwork/data-access';

// payee information
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
};
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
};
const payeeEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payeeDecryptionParameters: RequestNetwork.Types.Encryption.IDecryptionParameters = {
  key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// payer information
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};
const payerEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// third party information
const thirdPartySignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
};
const thirdPartyEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const thirdPartyDecryptionParameters: RequestNetwork.Types.Encryption.IDecryptionParameters = {
  key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// Payee Signature provider, for example @requestnetwork/epk-signature
const payeeSignatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

// Payee decryption provider, for example @requestnetwork/epk-decryption
const payeeDecryptionProvider: RequestNetwork.Types.DecryptionProvider.IDecryptionProvider =
  new EthereumPrivateKeyDecryptionProvider(payeeDecryptionParameters);

const mockStorage = new MockStorage();

const mockDataAccess = new MockDataAccess(mockStorage);

/* eslint-disable @typescript-eslint/no-floating-promises */
const payeeRequestNetwork = new RequestNetwork.RequestNetworkBase({
  decryptionProvider: payeeDecryptionProvider,
  signatureProvider: payeeSignatureProvider,
  dataAccess: mockDataAccess,
});

// Third party signature provider
const thirdPartySignatureProvider = new EthereumPrivateKeySignatureProvider(
  thirdPartySignatureInfo,
);

// Third party decryption provider
const thirdPartyDecryptionProvider: RequestNetwork.Types.DecryptionProvider.IDecryptionProvider =
  new EthereumPrivateKeyDecryptionProvider(thirdPartyDecryptionParameters);

const thirdPartyRequestNetwork = new RequestNetwork.RequestNetworkBase({
  decryptionProvider: thirdPartyDecryptionProvider,
  signatureProvider: thirdPartySignatureProvider,
  dataAccess: mockDataAccess,
});

const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'EUR',
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const paymentNetwork: RequestNetwork.Types.Payment.PaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Extension.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    paymentInfo: { IBAN: 'FR89370400440532013000', BIC: 'SABAIE2D' },
  },
};

/* eslint-disable no-console */

const createParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Optionally, compute the request ID before actually creating it.
// Setting the timestamp is recommended, as it has an impact on the generated ID.
createParams.requestInfo.timestamp = RequestNetwork.Utils.getCurrentTimestampInSecond();

const main = async () => {
  const requestId = await payeeRequestNetwork.computeRequestId(createParams);
  console.log(`The request will be created with ID ${requestId}`);
  const request = await payeeRequestNetwork._createEncryptedRequest(createParams, [
    payeeEncryptionParameters,
    payerEncryptionParameters,
  ]);
  console.log('request:', request.requestId);

  const confirmedRequestData = await request.waitForConfirmation();
  console.log('confirmed request data:');
  console.log(confirmedRequestData);

  const requestData = await request.addStakeholders(
    [thirdPartyEncryptionParameters],
    payeeIdentity,
  );
  console.log('request data after add stakeholders:');
  console.log(requestData);

  const payeeFetchedRequest = await payeeRequestNetwork.fromRequestId(requestId, {
    disablePaymentDetection: true,
  });
  console.log('payee fetched request:');
  console.log(payeeFetchedRequest.getData());

  const thirdPartyFetchedRequest = await thirdPartyRequestNetwork.fromRequestId(requestId, {
    disablePaymentDetection: true,
  });
  console.log('third party fetched request:');
  console.log(thirdPartyFetchedRequest.getData());
};
main();
