import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

const walletAddressValidator = require('wallet-address-validator');

import AddressBased from '../address-based';

/**
 * Implementation of the payment network to pay in ERC20 tokens based on an Ethereum address ON THE RINKEBY TESTNET
 * This payment network MUST BE USED ONLY for TEST PURPOSE. it MUST NEVER BE USED for real request.
 * With this extension one request can have two dedicated Ethereum addresses (one for payment and one for refund)
 * Every ERC20 ethereum transaction, using the request currency ERC20, that reaches these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
const erc20AddressBasedManager: ExtensionTypes.PnAddressBased.IAddressBased = {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
  isValidAddress,
};

/**
 * Creates the extensionsData to create the extension ERC20 testnet address based payment detection
 *
 * @param extensions extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
): ExtensionTypes.IAction {
  if (creationParameters.paymentAddress && !isValidAddress(creationParameters.paymentAddress)) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  if (creationParameters.refundAddress && !isValidAddress(creationParameters.refundAddress)) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  return AddressBased.createCreationAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED,
    creationParameters,
  );
}

/**
 * Creates the extensionsData to add a payment address
 *
 * @param extensions extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddPaymentAddressAction(
  addPaymentAddressParameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
): ExtensionTypes.IAction {
  if (
    addPaymentAddressParameters.paymentAddress &&
    !isValidAddress(addPaymentAddressParameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  return AddressBased.createAddPaymentAddressAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED,
    addPaymentAddressParameters,
  );
}

/**
 * Creates the extensionsData to add a refund address
 *
 * @param extensions extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddRefundAddressAction(
  addRefundAddressParameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
): ExtensionTypes.IAction {
  if (
    addRefundAddressParameters.refundAddress &&
    !isValidAddress(addRefundAddressParameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  return AddressBased.createAddRefundAddressAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED,
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
  // TODO: test for full list of supported ERC20 currencies
  if (requestState.currency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw Error(`This extension can be used only on ERC20 requests`);
  }

  return AddressBased.applyActionToExtension(
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
 * @param address address to check
 * @returns true if address is valid
 */
function isValidAddress(address: string): boolean {
  return walletAddressValidator.validate(address, 'ethereum');
}

export default erc20AddressBasedManager;
