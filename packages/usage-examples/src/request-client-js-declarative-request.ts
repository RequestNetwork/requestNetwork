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

// payer information
const payerSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
};
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
};

// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);
signatureProvider.addSignatureParameters(payerSignatureInfo);

const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'EUR',
  expectedAmount: '10000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const paymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.DECLARATIVE,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
    paymentInformation: { IBAN: 'FR89370400440532013000', BIC: 'SABAIE2D' },
  },
};

/* tslint:disable:no-floating-promises */
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider,
  useMockStorage: true,
});

// Create a request from the payee

/* tslint:disable:no-console */
// tslint:disable-next-line:typedef
(async () => {
  const request = await requestNetwork.createRequest({
    paymentNetwork,
    requestInfo,
    signer: payeeIdentity,
  });

  // wait the confirmation
  await request.waitForConfirmation();

  // the payer can declare that he sent a payment
  await request.declareSentPayment('11000', 'payment initiated from the bank', payerIdentity);

  // the payee can declare that he received a payment
  await request.declareReceivedPayment('10900', 'payment received', payeeIdentity);

  // the payer can give refund information
  await request.addRefundInformation(
    { IBAN: 'DE7777700440532013000', BIC: 'DDBBIE1D' },
    payerIdentity,
  );

  // the payee can declare that he sent a refund
  await request.declareSentRefund('1000', 'refund initiated from the bank', payeeIdentity);

  // the payer can declare that he received a payment
  let requestData = await request.declareReceivedRefund('700', 'refund received', payerIdentity);

  requestData = await new Promise((resolve): any => request.on('confirmed', resolve));

  if (requestData.balance) {
    console.log('request balance: ', requestData.balance.balance);
    console.log('request balance events: ', requestData.balance.events);
  }
  // Get payment network information
  const paymentNetworkInformation = requestData.extensions['pn-any-declarative'];
  console.log('Payment network, values declared: ', paymentNetworkInformation.values);
  console.log('Payment network, events: ', paymentNetworkInformation.events);
})();
