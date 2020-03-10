/**
 * # Creating an ER20 request
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
 * Identities are the unique identifier of a request user. They are generally different from payment addresses, but can be the same. They identify an entity like a person or business.
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
 * The signature is a proof of who created the request and of it's integrity (that no data changed after it was signed).
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
 * Proxy contract payment network parameters are the same as the address based payment network: the payment and eventually the refund address.
 */

const proxyContractPaymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0x92FC764853A9A0287b7587E59aDa47165b3B2675',
  },
};

const proxyContractCreateParams = {
  proxyContractPaymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Finally create the request and print its id
(async () => {
  const request = await requestNetwork.createRequest(proxyContractCreateParams);

  console.log(`Request created with erc20 proxy contract payment network: ${request.requestId}`);
})();

/**
 * ### Paying an erc20 proxy contract request with Request payment processor
 * 
 * Requests using ERC20 proxy contract payment network can be paid with the Request payment processor, in order to simplify interactions with the involved smart contracts
 */

 // Import necessary packages
 import { hasSufficientFunds, payRequest } from '@requestnetwork/payment-processor';
 import { Wallet } from 'ethers';
 
 // Create a wallet for the payer for demo purpose
 const wallet = Wallet.createRandom();
 
 (async () => {
   const request = await requestNetwork.createRequest(proxyContractCreateParams);
 
   // Check the payer has sufficient fund for the data
   const payerAddress = wallet.address;
   const requestData = request.getData();
   if (!(await hasSufficientFunds(requestData, payerAddress))) {
     throw new Error('You do not have enough funds to pay this request');
   }
 
   // Pay the request
   // The value provided for wallet can be a Web3Provider from 'ethers/providers' to be able to pay with Metamask
   const tx = await payRequest(requestData, wallet);
   await tx.wait(1);
 })(); 

/**
 * ## Request creation with address based payment network
 *
 * To create a request using the erc20 address based payment network, we need to provide the payment network parameters to the request creation parameters.
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
 * ### Paying an erc20 address based request
 * 
 * Requests created with the address based payment network must be manually paid by sending an erc20 transfer to the payment address.
 * You can do this by calling `transfer(to, amount)` method of the erc20 token. `to` is the payment address and `amount` the amount the payer wants to pay.
 */
