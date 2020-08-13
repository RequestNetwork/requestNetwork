/**
 * # Creating an ERC20 request
 *
 * This is an example of creating a request using an erc20 payment network
 * The request will be stored in memory and cleared as soon as the script is finished running.
 */

/**
 * ## Basics
 *
 * For both erc20 payment networks, Request Client must be initialized.
 */

/**
 * ### Imports
 *
 * First we import the 2 packages we will need to create the request:
 */
// The signature provider allows us to sign the request
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
// RequestNetwork is the interface we will use to interact with the Request network
import * as RequestNetwork from '@requestnetwork/request-client.js';

/**
 * ### Identity
 *
 * To create a request we need to declare the identities of the parties involved.
 * Identities are the unique identifier of a request user. They are generally different from payment addresses but can be the same. They identify an entity like a person or business.
 */

// Here we declare the payee identity, with the payee identity ethereum address
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

// Here we declare the (optional, but recommended) payer identity address.
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0xF317BedAA5c389F2C6f469FcF25e0752C7228Ba6',
};

/**
 * ### Signature Provider
 *
 * The Ethereum private key signature provider allows a user to pass in their private Ethereum key to sign a request. The signer is either the payee or the payer.
 * The signature is proof of who created the request and of its integrity (that no data changed after it was signed).
 * This process is similar to the signature of an Ethereum transaction.
 */

// The signature info requires the request creator private key.
// For this demo purposes, we hard-coded the private key. Please be careful with how you store and handle your private key since it's a very sensitive piece of data.
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

// We can initialize the RequestNetwork class with the signature provider and inform we will be using the mock storage.
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider,
  useMockStorage: true,
});

/**
 * ### Request Information
 *
 * In the next section of code we declare the request information.
 */

// The main request info, with the currency, amount (in the smallest denominator), payee identity and payer identity
const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'REQ',
  expectedAmount: '1000000000000000000', // 1 REQ
  payee: payeeIdentity,
  payer: payerIdentity,
};

/**
 * ## Request creation with the proxy contract payment network
 *
 * To create a request using erc20 proxy contract payment network, we need to provide the payment network parameters to the request creation parameters.
 * Proxy contract payment network parameters are the same as the address-based payment network: the payment and eventually the refund address.
 */

const paymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0x92FC764853A9A0287b7587E59aDa47165b3B2675',
  },
};

const proxyContractCreateParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Finally create the request and print its id
(async () => {
  const request = await requestNetwork.createRequest(proxyContractCreateParams);

  console.log(`Request created with erc20 proxy contract payment network: ${request.requestId}`);
})();

/**
 * ## Request creation with address-based payment network
 *
 * To create a request using the erc20 address-based payment network, we need to provide the payment network parameters to the request creation parameters.
 */

const addressBasedPaymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
  parameters: {
    paymentAddress: '0x92FC764853A9A0287b7587E59aDa47165b3B2675',
  },
};

const addressBasedCreateParams = {
  addressBasedPaymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Finally create the request and print its id
(async () => {
  const request = await requestNetwork.createRequest(addressBasedCreateParams);

  console.log('Request created with erc20 address based payment network:');
  console.log(request.requestId);
})();

/**
 * ## Checking the balance of an erc20 request
 *
 * The function getData() of a request provides its balance
 * This function is available independently of the payment network used
 */

// Import Big Number package
const BN = require('bn.js');

(async () => {
  // Use a proxy contract request for example
  const request = await requestNetwork.createRequest(proxyContractCreateParams);

  // Check the balance of the request
  const requestData = request.getData();
  const balanceObject = requestData.balance;

  if (!balanceObject) {
    console.error('balance no set');
    return;
  }

  if (balanceObject.error) {
    console.error(balanceObject.error.message);
    return;
  }

  console.log(`Balance of the erc20 proxy contract request: ${balanceObject.balance}`);

  // Check if the request has been paid
  // Convert the balance to big number type for comparison
  const expectedAmount = new BN(requestData.expectedAmount);
  const balanceBigNumber = new BN(balanceObject.balance);

  // Check if balanceBigNumber is greater or equal to expectedAmount
  const paid = balanceBigNumber.gte(expectedAmount);
})();
