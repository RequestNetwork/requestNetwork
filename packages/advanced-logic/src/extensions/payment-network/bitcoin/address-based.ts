import {
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import BTCMainnet from './mainnet-address-based';
import BTCTestnet from './testnet-address-based';

/**
 * Core of the payment network bitcoin address based
 * This module is called by mainnet-address-based and testnet-address-based to avoid code redundancy
 */
const bitcoinAddressBased = {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
};
export default bitcoinAddressBased;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData to create the extension Bitcoin based on the addresses
 *
 * @param extensions extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  extensionId: ExtensionTypes.ID,
  creationParameters: ExtensionTypes.PnBitcoinAddressBased.ICreationParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.ACTION.CREATE,
    id: extensionId,
    parameters: {
      paymentAddress: creationParameters.paymentAddress,
      refundAddress: creationParameters.refundAddress,
    },
    version: CURRENT_VERSION,
  };
}

/**
 * Creates the extensionsData to add a payment address
 *
 * @param extensions extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddPaymentAddressAction(
  extensionId: ExtensionTypes.ID,
  addPaymentAddressParameters: ExtensionTypes.PnBitcoinAddressBased.IAddPaymentAddressParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
    id: extensionId,
    parameters: {
      paymentAddress: addPaymentAddressParameters.paymentAddress,
    },
  };
}

/**
 * Creates the extensionsData to add a refund address
 *
 * @param extensions extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddRefundAddressAction(
  extensionId: ExtensionTypes.ID,
  addRefundAddressParameters: ExtensionTypes.PnBitcoinAddressBased.IAddRefundAddressParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_REFUND_ADDRESS,
    id: extensionId,
    parameters: {
      refundAddress: addRefundAddressParameters.refundAddress,
    },
  };
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
  if (requestState.currency !== RequestLogicTypes.CURRENCY.BTC) {
    throw Error(`This extension can be used only on BTC request`);
  }
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  // check if it is a testnet or mainnet BTC payment network
  let btc: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBased | null = null;
  if (extensionAction.id === ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED) {
    btc = BTCMainnet;
  }
  if (extensionAction.id === ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED) {
    btc = BTCTestnet;
  }
  if (btc === null) {
    throw Error(`This extension is not recognized by the BTC payment network address based`);
  }

  if (extensionAction.action === ExtensionTypes.PnBitcoinAddressBased.ACTION.CREATE) {
    if (requestState.extensions[extensionAction.id]) {
      throw Error(`This extension have already been created`);
    }

    copiedExtensionState[extensionAction.id] = applyCreation(btc, extensionAction, timestamp);

    return copiedExtensionState;
  }

  // if the action is not "create", the state must have been created before
  if (!requestState.extensions[extensionAction.id]) {
    throw Error(`This extension must have been already created`);
  }

  if (extensionAction.action === ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_PAYMENT_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddPaymentAddress(
      btc,
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_REFUND_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddRefundAddress(
      btc,
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  throw Error(`Unknown action: ${extensionAction.action}`);
}

/** Applies a creation
 *
 * @param extensionAction action to apply
 *
 * @returns state of the extension created
 */
function applyCreation(
  btc: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBased,
  extensionAction: ExtensionTypes.IAction,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.paymentAddress &&
    !btc.isValidAddress(extensionAction.parameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid bitcoin address');
  }
  if (
    extensionAction.parameters.refundAddress &&
    !btc.isValidAddress(extensionAction.parameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid bitcoin address');
  }
  return {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: extensionAction.parameters.paymentAddress,
          refundAddress: extensionAction.parameters.refundAddress,
        },
        timestamp,
      },
    ],
    id: extensionAction.id,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: extensionAction.parameters.paymentAddress,
      refundAddress: extensionAction.parameters.refundAddress,
    },
    version: CURRENT_VERSION,
  };
}

/** Applies add payment address
 *
 * @param extensionState previous state of the extension
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddPaymentAddress(
  btc: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBased,
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.paymentAddress &&
    !btc.isValidAddress(extensionAction.parameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid bitcoin address');
  }
  if (extensionState.values.paymentAddress) {
    throw Error(`Payment address already given`);
  }
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // update payment address
  copiedExtensionState.values.paymentAddress = extensionAction.parameters.paymentAddress;
  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
    parameters: { paymentAddress: extensionAction.parameters.paymentAddress },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies add refund address
 *
 * @param extensionState previous state of the extension
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddRefundAddress(
  btc: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBased,
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.refundAddress &&
    !btc.isValidAddress(extensionAction.parameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid bitcoin address');
  }
  if (extensionState.values.refundAddress) {
    throw Error(`Refund address already given`);
  }
  if (!requestState.payer) {
    throw Error(`The request must have a payer`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
    throw Error(`The signer must be the payer`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // update refund address
  copiedExtensionState.values.refundAddress = extensionAction.parameters.refundAddress;
  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_REFUND_ADDRESS,
    parameters: { refundAddress: extensionAction.parameters.refundAddress },
    timestamp,
  });

  return copiedExtensionState;
}
