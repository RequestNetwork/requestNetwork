import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import * as RequestNetwork from '@requestnetwork/request-client.js';

// payee information
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const payeeEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payeeDecryptionParameters: RequestNetwork.Types.Encryption.IDecryptionParameters = {
  key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// payer information
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};
const payerEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

// A decryption provider, for example @requestnetwork/epk-decryption
const decryptionProvider: RequestNetwork.Types.DecryptionProvider.IDecryptionProvider = new EthereumPrivateKeyDecryptionProvider(
  payeeDecryptionParameters,
);

const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'BTC',
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const paymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
    paymentAddress: '1LEMZPBit6tTtjXfaEfz4yYmTuctHWoMV',
  },
};

/* tslint:disable:no-floating-promises */
const requestNetwork = new RequestNetwork.RequestNetwork({
  decryptionProvider,
  signatureProvider,
  useMockStorage: true,
});

/* tslint:disable:no-console */

const createParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Optionally, compute the request ID before actually creating it.
// Setting the timestamp is recommended, as it has an impact on the generated ID.
createParams.requestInfo.timestamp = RequestNetwork.Utils.getCurrentTimestampInSecond();
requestNetwork
  .computeRequestId(createParams)
  .then(requestId => {
    console.log(`The request will be created with ID ${requestId}`);
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });

requestNetwork
  .createRequest(createParams)
  .then(request => {
    console.log('clear request:');
    console.log(request.requestId);
    request
      .waitForConfirmation()
      .then(confirmedRequest => {
        console.log('clear confirmed request:');
        console.log(confirmedRequest);
      })
      .catch(error => {
        console.error(error.message || error);
        process.exit(1);
      });
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });

requestNetwork
  ._createEncryptedRequest(createParams, [payeeEncryptionParameters, payerEncryptionParameters])
  .then(request => {
    console.log('encrypted request:');
    console.log(request.requestId);
    request
      .waitForConfirmation()
      .then(confirmedRequest => {
        console.log('encrypted confirmed request:');
        console.log(confirmedRequest);
      })
      .catch(error => {
        console.error(error.message || error);
        process.exit(1);
      });
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });
