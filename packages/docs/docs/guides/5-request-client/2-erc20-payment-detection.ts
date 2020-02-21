/**
 * # Creating a Request using an erc20 payment network
 *
 * This is an example of creating a request, using an erc20 payment network
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
// The signature provider allow us to sign the request
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
// RequestNetwork is the interface we will use to interact with the Request network
import * as RequestNetwork from '@requestnetwork/request-client.js';

/**
 * ### Identity
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
  value: '0xF317BedAA5c389F2C6f469FcF25e0752C7228Ba6',
};

/**
 * ### Signature Provider
 *
 * The Ethereum private key signature provider allows a user to pass in their private Ethereum key to sign a request.
 * The signature is a proof of who created the request and of it's integrity (that no data changed after it was signed).
 * This process is similar to the signature of an Ethereum transaction.
 */

// The signature info requires the request creator private key.
// Please be careful with how you store and handle your private key since it's a very sensitive piece of data.
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

// Add the payer private key to the signature provider to be able to accept the request
const payerSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0x05e35c0171aef18b87578800e1c15d819408df07907b6823aa48d0f568b1aa9a',
};

signatureProvider.addSignatureParameters(payerSignatureInfo);

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
 * ## Request creation with address based payment network
 *
 * To create a request using the erc20 address based payment network, we need to provide the payment network parameters to the request creation parameters.
 */

const addressBasedPaymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
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

  // The payer can add a refund address. For example when accepting the request
  await request.accept(payerIdentity, {
    refundAddress: '0xfb7914D846ab64A44c4e65dd38F4D004d29F911F',
  });
})();

/**
 * ### Paying an erc20 address based request
 * 
 * Requests created with the address based payment network must be manually paid by sending an erc20 transfer to the payment address.
 * You can do this by calling `transfer(to, amount)` method of the erc20 token. `to` is the payment address and `amount` the amount the payer wants to pay.
 */

/**
 * ## Request creation with the proxy contract payment network
 *
 * To create a request using erc20 proxy contract payment network, we need to provide the payment network parameters to the request creation parameters.
 * Proxy contract payment network parameters are the same as the address based payment network: the payment and eventually the refund address.
 */

const proxyContractPaymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
  parameters: {
    // eslint-disable-next-line spellcheck/spell-checker
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

  // The payer can add a refund address. For example when accepting the request
  await request.accept(payerIdentity, {
    refundAddress: '0xfb7914D846ab64A44c4e65dd38F4D004d29F911F',
  });
})();

// eslint-disable-next-line spellcheck/spell-checker
/**
 * ### Paying an erc20 proxy contract request manually
 * 
 * Payments for requests using ERC20 proxy contract payment network are documented in an Ethereum smart contract: *ERC20Proxy*. This smart contract is available on Ethereum [mainnet](https://etherscan.io/address/0x5f821c20947ff9be22e823edc5b3c709b33121b3) and Rinkeby [testnet](https://rinkeby.etherscan.io/address/0x162edb802fae75b9ee4288345735008ba51a4ec9).
 * To perform a payment, the payer has first to allow the smart contract to transfer funds from his address. You must call `approve(spender, amount)` method of the specific ERC20 token smart contract. `spender` is the address of the proxy smart contract (`0x5f821c20947ff9be22e823edc5b3c709b33121b3` on mainnet, `0x162edb802fae75b9ee4288345735008ba51a4ec9` on Rinkeby), `amount` is the maximum amount you want to allow the proxy contract to transfer funds.
 * Since the payer could eventually pay other requests,  amount can be `2**32 - 1` (maximum value of a uint32 in solidity language) so that the payer only has to call `approve` once.
 * Then, payment can be performed by calling `transferFromWithReference(tokenAddress, to, amount, paymentReference)` method. `tokenAddress` is the address of the ERC20 token, to is the Ethereum address of the payee, `amount` is the amount of the payment. The user has to provide a payment reference to link the payments to the request. The payment reference is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`.
 * Any payments documented in the ERC20 proxy contract with the correct reference is considered as a payment for the request. The payments made with this method can be retrieved in the `TransferWithReference` event logs of the proxy smart contract.
 */

// Functions are provided to get the payment reference and the payment address from the request
import { utils } from '@requestnetwork/payment-processor';

(async () => {
  const request = await requestNetwork.createRequest(proxyContractCreateParams);

  const { paymentReference, paymentAddress } = utils.getRequestPaymentValues(request);

  console.log(`Payment reference of the request: ${paymentReference}`);
  console.log(`Payment address of the request: ${paymentAddress}`);
})();

/**
 * ### Paying an erc20 proxy contract request with Request payment processor
 * 
 * Requests using ERC20 proxy contract payment network can be automatically paid with the Request payment processor
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