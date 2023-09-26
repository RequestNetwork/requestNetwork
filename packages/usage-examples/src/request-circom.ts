
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import * as RequestNetwork from '@requestnetwork/request-client.js';




// payee information
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.EDDSA_POSEIDON,
  privateKey: '0001020304050607080900010203040506070809000102030405060708090001',
};
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.POSEIDON_ADDRESS,
  value: 'a72a20d524c018ffc378feeb04a81f860965827ef7478a079a1bba02382b5808',
};

// payer information
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.POSEIDON_ADDRESS,
  value: 'c51da3491a2d0cd6eb789627e3aa569031cbf127f634f2bea4b8808fd1232920',
};



const payeeEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payeeDecryptionParameters: RequestNetwork.Types.Encryption.IDecryptionParameters = {
  key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payerEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

// A decryption provider, for example @requestnetwork/epk-decryption
const decryptionProvider: RequestNetwork.Types.DecryptionProvider.IDecryptionProvider =
  new EthereumPrivateKeyDecryptionProvider(payeeDecryptionParameters);


// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider();

const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'DAI',
  expectedAmount: '1000000000000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const paymentNetwork: RequestNetwork.Types.Payment.PaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    feeAmount: '100000000000000000',
    feeAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
};

/* eslint-disable @typescript-eslint/no-floating-promises */
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider,
  useMockStorage: true,
  decryptionProvider,
});

/* eslint-disable no-console */

const createParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,

};


(async () => {
  await signatureProvider.addSignatureParameters(payeeSignatureInfo);

  createParams.requestInfo.timestamp = 1544426030; //RequestNetwork.Utils.getCurrentTimestampInSecond();
  const request = await requestNetwork._createEncryptedRequest(createParams,[payeeEncryptionParameters,payerEncryptionParameters]);
  console.log(`The request will be created with ID ${request}`);
  const confirmedRequest = await request.waitForConfirmation()
  console.log('Confirmed request:');
  console.log(confirmedRequest);
})()
// Optionally, compute the request ID before actually creating it.
// Setting the timestamp is recommended, as it has an impact on the generated ID.

// requestNetwork
//   .createRequest(createParams)
//   .then((request) => {
//     console.log('clear request:');
//     console.log(request);
//     request
//       .waitForConfirmation()
//       .then((confirmedRequest) => {
//         console.log('clear confirmed request:');
//         console.log(confirmedRequest);
//       })
//       .catch((error) => {
//         console.error(error.message || error);
//         process.exit(1);
//       });
//   })
//   .catch((error) => {
//     console.error(error.message || error);
//     process.exit(1);
//   });
