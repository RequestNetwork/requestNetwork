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
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};

// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'SAI',
  expectedAmount: '1000000000000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

const paymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
    paymentAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
  },
};

/* tslint:disable:no-floating-promises */
const requestNetwork = new RequestNetwork.RequestNetwork({
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
    console.log(request);
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
