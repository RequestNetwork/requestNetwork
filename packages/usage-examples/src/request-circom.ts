
// @ts-ignore
import { providers, Wallet } from 'ethers';


import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import * as RequestNetwork from '@requestnetwork/request-client.js';
// @ts-ignore
import * as RequestPaymentProcessor from '@requestnetwork/payment-processor';



// payee information
// @ts-ignore
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.EDDSA_POSEIDON,
  privateKey: '0001020304050607080900010203040506070809000102030405060708090001',
};
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.POSEIDON_ADDRESS,
  value: 'a72a20d524c018ffc378feeb04a81f860965827ef7478a079a1bba02382b5808',
};

// payer information
// @ts-ignore
const payerSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.EDDSA_POSEIDON,
  privateKey: '0000000304050607080900010203040506070809000102030405060708090001',
};
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.POSEIDON_ADDRESS,
  value: 'c51da3491a2d0cd6eb789627e3aa569031cbf127f634f2bea4b8808fd1232920',
};


// @ts-ignore
const payeeEncryptionParameters: RequestNetwork.Types.Encryption.IEncryptionParameters = {
  key: '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payeeDecryptionParameters: RequestNetwork.Types.Encryption.IDecryptionParameters = {
  key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
// @ts-ignore
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
  currency: {
    type: RequestNetwork.Types.RequestLogic.CURRENCY.ERC20,
    value: "0x9FBDa871d559710256a2502A2517b794B482Db40",
    network: 'private'
  },
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
// @ts-ignore
const createParams: RequestNetwork.Types.ICreateRequestParameters = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity
};


(async () => {
  const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
  const provider = new providers.JsonRpcProvider('http://localhost:8545');
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  await signatureProvider.addSignatureParameters(payeeSignatureInfo);
  await signatureProvider.addSignatureParameters(payerSignatureInfo);

  createParams.requestInfo.timestamp = RequestNetwork.Utils.getCurrentTimestampInSecond();
  const request1 = await requestNetwork._createEncryptedRequest(createParams,[payeeEncryptionParameters,payerEncryptionParameters]);
  console.log(`The request will be created with ID ${request1.requestId} -------------------------------------------`);
  await request1.waitForConfirmation();
  // createParams.requestInfo.timestamp = RequestNetwork.Utils.getCurrentTimestampInSecond();
  // const request2 = await requestNetwork._createEncryptedRequest(createParams,[payeeEncryptionParameters,payerEncryptionParameters]);
  // console.log(`The request will be created with ID ${request2.requestId} -------------------------------------------`);
  

  // createParams.requestInfo.timestamp = RequestNetwork.Utils.getCurrentTimestampInSecond();
  // const request3 = await requestNetwork._createEncryptedRequest(createParams,[payeeEncryptionParameters,payerEncryptionParameters]);
  // console.log(`The request will be created with ID ${request3.requestId} -------------------------------------------`);

  // await request3.waitForConfirmation();
  
  console.log(request1.getData());
  // console.log(request2.getData().state);
  // console.log(request3.getData().state);

  
  await request1.accept(payerIdentity);
  // await request2.accept(payerIdentity);
  // await request3.accept(payerIdentity);
  
  console.log(request1.getData().state);
  // console.log(request2.getData().state);
  // console.log(request3.getData().proofs);


  const paymentReq1 = await RequestPaymentProcessor.payErc20FeeProxyRequest(request1.getData(), wallet);
  // console.log({paymentReq1});
  await paymentReq1.wait();

  
  console.log(await request1.refresh());
  

  // const waitAccept3 = await new Promise(resolve => {
  //   console.log("wait accept 3")
  //   request1.on('confirmed', (resultPersistTxConfirmed) => {
  //     console.log('Accepted request 3 ! -------------------------------------------');
  //     console.log(resultPersistTxConfirmed.proofs);
  //     resolve(resultPersistTxConfirmed.proofs);
  //   });
  // })
  // console.log(waitAccept3);


  // request2.on('confirmed', (resultPersistTxConfirmed) => {
  //   console.log('Accepted request 2 ! -------------------------------------------');
  //   console.log(resultPersistTxConfirmed.proofs);
  // });


  // request3.on('confirmed', (resultPersistTxConfirmed) => {
  //   console.log('Accepted request 3 ! -------------------------------------------');
  //   console.log(resultPersistTxConfirmed.proofs);
  // });


})()
