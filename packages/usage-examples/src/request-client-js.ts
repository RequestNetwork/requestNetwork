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

// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

const requestInfo: RequestNetwork.Types.RequestLogic.ICreateParameters = {
  currency: RequestNetwork.Types.RequestLogic.CURRENCY.BTC,
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: {
    type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const paymentNetwork: RequestNetwork.Types.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
    paymentAddress: '1LEMZPBit6tTtjXfaEfz4yYmTuctHWoMV',
  },
};

/* tslint:disable:no-floating-promises */
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider,
  useMockStorage: true,
});

/* tslint:disable:no-console */
requestNetwork
  .createRequest({
    paymentNetwork,
    requestInfo,
    signer: payeeIdentity,
  })
  .then(request => {
    console.log(request.requestId);
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });
