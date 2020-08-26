/**
 * # Creating a request using the Declarative payment network
 *
 * This is an example of creating a request using the Declarative payment network
 * The request will be stored in memory and cleared as soon as the script is finished running.
 */

/**
 * ## Basics
 *
 * Before creating a request, the Request Client must be initialized.
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
  currency: 'EUR', // The Declarative payment network is currency agnostic, we can use any currency supported by Request
  expectedAmount: '100', // This equals 1 EUR
  payee: payeeIdentity,
  payer: payerIdentity,
};

/**
 * ## Request creation with the declarative payment network
 *
 * To create a request using a declarative payment network, we need to provide the payment network parameters to the request creation parameters.
 * The parameters are paymentInfo and optionally refundInfo
 * This value can be any Javascript object. This object should allow the payer to know how to pay the request.
 * For example, for a European transfer, we could provide the IBAN and the BIC of the receiving bank account
 */

const paymentNetwork: RequestNetwork.Types.Payment.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.DECLARATIVE,
  parameters: {
    paymentInfo: {
      IBAN: 'FR123456789123456789',
      BIC: 'CE123456789',
    },
  },
};

const declarativeCreateParams = {
  paymentNetwork,
  requestInfo,
  signer: payeeIdentity,
};

// Finally create the request and print its id
(async () => {
  const request = await requestNetwork.createRequest(declarativeCreateParams);

  console.log(`Request created with Declarative payment network: ${request.requestId}`);
})();

/**
 * ## Declaring sent and received payments and checking balance
 *
 * The Declarative payment network doesn't provide payment detection method to determine the balance of the request
 * The balance of the request is defined by the declared payments by the payee and the declared refunds by the payer
 */

// Import Big Number package
const BN = require('bn.js')(async () => {
  const request = await requestNetwork.createRequest(declarativeCreateParams);

  // Declare received payments
  // The payee can declare the amount received, this amount will be added to the balance of the request
  request.declareReceivedPayment('1000', 'payment received', payeeIdentity);

  // The payer can declare a sent payment, this amount is not taken into account for the request balance
  // But the note provided can help to solve dispute
  request.declareSentPayment('1000', 'payment sent', payerIdentity);

  // Declare received refunds
  // The payer can declare received refunds, this amount will be subtracted from the balance of the request
  request.declareReceivedPayment('900', 'refund received', payerIdentity);

  // Declaring a sent refund, this amount is not taken into account for the request balance
  request.declareSentPayment('900', 'received too much', payeeIdentity);

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

  console.log(`Balance of the declarative request: ${balanceObject.balance}`);

  // Check if the request has been paid
  // Convert the balance to big number type for comparison
  const expectedAmount = new BN(requestData.expectedAmount);
  const balanceBigNumber = new BN(balanceObject.balance);

  // Check if balanceBigNumber is greater or equal to expectedAmount
  const paid = balanceBigNumber.gte(expectedAmount);
})();
