import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBased from '../reference-based';

const walletAddressValidator = require('wallet-address-validator');

const CURRENT_VERSION = '0.2.0';

/**
 * Implementation of the payment network to pay in ETH based on input data.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ETH ethereum transaction that reaches these addresses and has the correct input data will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
const ethInputData: ExtensionTypes.PnReferenceBased.IReferenceBased = {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
  isValidAddress,
};

const supportedNetworks = ['mainnet', 'rinkeby'];

/**
 * Creates the extensionsData to create the ETH payment detection extension
 *
 * @param creationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PnReferenceBased.ICreationParameters,
): ExtensionTypes.IAction {
  if (creationParameters.paymentAddress && !isValidAddress(creationParameters.paymentAddress)) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  if (creationParameters.refundAddress && !isValidAddress(creationParameters.refundAddress)) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  return ReferenceBased.createCreationAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    creationParameters,
    CURRENT_VERSION,
  );
}

/**
 * Creates the extensionsData to add a payment address
 *
 * @param addPaymentAddressParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddPaymentAddressAction(
  addPaymentAddressParameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
): ExtensionTypes.IAction {
  if (
    addPaymentAddressParameters.paymentAddress &&
    !isValidAddress(addPaymentAddressParameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  return ReferenceBased.createAddPaymentAddressAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    addPaymentAddressParameters,
  );
}

/**
 * Creates the extensionsData to add a refund address
 *
 * @param addRefundAddressParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddRefundAddressAction(
  addRefundAddressParameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
): ExtensionTypes.IAction {
  if (
    addRefundAddressParameters.refundAddress &&
    !isValidAddress(addRefundAddressParameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  return ReferenceBased.createAddRefundAddressAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    addRefundAddressParameters,
  );
}

/**
 * Applies the extension action to the request
 * Is called to interpret the extensions data when applying the transaction
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  extensionsState: RequestLogicTypes.IExtensionStates,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): RequestLogicTypes.IExtensionStates {
  if (
    requestState.currency.type !== RequestLogicTypes.CURRENCY.ETH ||
    (requestState.currency.network && !supportedNetworks.includes(requestState.currency.network))
  ) {
    throw Error(
      `This extension can be used only on ETH requests and on supported networks ${supportedNetworks.join(
        ', ',
      )}`,
    );
  }

  return ReferenceBased.applyActionToExtension(
    isValidAddress,
    extensionsState,
    extensionAction,
    requestState,
    actionSigner,
    timestamp,
  );
}

/**
 * Check if an ethereum address is valid
 *
 * @param {string} address address to check
 * @returns {boolean} true if address is valid
 */
function isValidAddress(address: string): boolean {
  return walletAddressValidator.validate(address, 'ethereum');
}

export default ethInputData;
