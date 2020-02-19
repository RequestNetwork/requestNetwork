/**
 * Creating a DAI Request using a local Request Node
 * ============================================
 *
 * In this example we will create a request with automatic payment detection. The currency for this request will be DAI.
 * The request will be created at a node running locally (https://docs.request.network/request-protocol/getting-started-1/deploy-a-request-node).
 */

/**
 * ## Imports
 *
 * First we import the 2 packages we will need to create the request:
 */
// The signature provider allow us to sign the request
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
// RequestNetwork is the interface we will use to interact with the Request network
import * as RequestNetwork from '@requestnetwork/request-client.js';

/**
 * ## Identity
 *
 * To create a request we need to declare the identities of the parties involved.
 * Identities are the unique identifier of a request user. They are not payment addresses, only unique addresses that identify a person/entity.
 */

// Here we declare the payee identity,  with the payee identity ethereum address
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

// Here we declare the (optional, but recommended) payer identity address.
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};

/**
 * ## Signature Provider
 *
 * The ethereum private key signature provider allow a user to pass in their private ethereum key to sign a request.
 * The signature is a proof of who created the request and of it's integrity (that no data changed after it was signed).
 * This process is similar to the signature of an Ethereum transaction.
 */

// The signature info requires the request creator private key.
// Please be careful with how you store and handle your private key, since it's a very sensitive piece of data.
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

/**
 * ## Payment Network
 *
 * In this section we declare a payment network.
 * It allows us to declare how we will detect and update the payment status for the request.
 *
 * For this request, we will use the ERC20 proxy contact payment network. This payment network allows automatic detection of an ERC20 request payment.
 * For this detection to work, the payer will send a payment with some data to a proxy contract that will store the data for later detection and forward the payment instantly.
 *
 * To create the payment network we declare the network ID (from one of the available here: https://docs.request.network/request-protocol/payment-detection)
 * and the payment address where we want the payer to send the money to.
 */
const paymentNetwork: RequestNetwork.Types.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
  },
};

/**
 * ## Request Information
 *
 * In the next section of code we declare the request information.
 */

// The main request info, with the currency, amount (in the smallest denominator), payee identity and payer identity
const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'DAI',
  expectedAmount: '1000000000000000000', // 1 DAI
  payee: payeeIdentity,
  payer: payerIdentity,
};

const createParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

/**
 * ## Request Creation
 *
 * Time for action!
 */

// We initialize the RequestNetwork class with the signature provider and the gateway address
const requestNetwork = new RequestNetwork.RequestNetwork({
  nodeConnectionConfig: { baseURL: 'http://localhost:3000' },
  signatureProvider,
});

requestNetwork.createRequest(createParams).then(request => {
  console.log('Request created:');
  console.log(request.requestId);
});
