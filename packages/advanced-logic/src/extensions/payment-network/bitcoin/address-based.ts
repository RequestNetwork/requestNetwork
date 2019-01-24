import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/**
 * Implementation of the payment network to pay in BTC based on the addresses
 * With this extension one request can have two dedicated bitcoin addresses (one for payment and one for refund)
 * Every bitcoin transaction that reach these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
const bitcoinAddressBasedManager: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBasedManager = {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
};
export default bitcoinAddressBasedManager;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData to create the extension Bitcoin based on the addresses
 *
 * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be store in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PnBitcoinAddressBased.IPnBtcAddressBasedCreationParameters,
): ExtensionTypes.IExtensionAction {
  // TODO PROT-277: check if creationParameters.paymentAddress is a bitcoin address
  // TODO PROT-277: check if creationParameters.refundAddress is a bitcoin address
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE,
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
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
 * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
 *
 * @returns IExtensionAction the extensionsData to be store in the request
 */
function createAddPaymentAddressAction(
  addPaymentAddressParameters: ExtensionTypes.PnBitcoinAddressBased.IPnBtcAddressBasedAddPaymentAddressParameters,
): ExtensionTypes.IExtensionAction {
  // TODO PROT-277: check if creationParameters.paymentAddress is a bitcoin address
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    parameters: {
      paymentAddress: addPaymentAddressParameters.paymentAddress,
    },
  };
}

/**
 * Creates the extensionsData to add a refund address
 *
 * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
 *
 * @returns IExtensionAction the extensionsData to be store in the request
 */
function createAddRefundAddressAction(
  addRefundAddressParameters: ExtensionTypes.PnBitcoinAddressBased.IPnBtcAddressBasedAddRefundAddressParameters,
): ExtensionTypes.IExtensionAction {
  // TODO PROT-277: check if creationParameters.refundAddress is a bitcoin address
  return {
    action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    parameters: {
      refundAddress: addRefundAddressParameters.refundAddress,
    },
  };
}

/**
 * Applies the extension action to the request
 * Is called to interpret the extensions data when applying the transaction
 *
 * @param extensionsState IRequestLogicExtensionStates previous state of the extensions
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 * @param actionSigner IIdentity identity of the signer
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  extensionsState: RequestLogicTypes.IRequestLogicExtensionStates,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: RequestLogicTypes.IRequestLogicRequest,
  actionSigner: IdentityTypes.IIdentity,
): RequestLogicTypes.IRequestLogicExtensionStates {
  if (requestState.currency !== RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC) {
    throw Error(`This extension can be used only on BTC request`);
  }
  const copiedExtensionState: RequestLogicTypes.IRequestLogicExtensionStates = Utils.deepCopy(
    extensionsState,
  );

  if (
    extensionAction.action ===
    ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE
  ) {
    if (
      requestState.extensions[ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]
    ) {
      throw Error(`This extension have already been created`);
    }

    copiedExtensionState[
      ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED
    ] = applyCreation(extensionAction);

    return copiedExtensionState;
  }

  // if the action is not "create", the state must have been created before
  if (!requestState.extensions[ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]) {
    throw Error(`This extension must have been already created`);
  }

  if (
    extensionAction.action ===
    ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS
  ) {
    copiedExtensionState[
      ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED
    ] = applyAddPaymentAddress(
      copiedExtensionState[ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED],
      extensionAction,
      requestState,
      actionSigner,
    );

    return copiedExtensionState;
  }

  if (
    extensionAction.action ===
    ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS
  ) {
    copiedExtensionState[
      ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED
    ] = applyAddRefundAddress(
      copiedExtensionState[ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED],
      extensionAction,
      requestState,
      actionSigner,
    );

    return copiedExtensionState;
  }

  throw Error(`Unknown action: ${extensionAction.action}`);
}

/** Applies a creation
 *
 * @param extensionAction IExtensionAction action to apply
 *
 * @returns state of the extension created
 */
function applyCreation(
  extensionAction: ExtensionTypes.IExtensionAction,
): ExtensionTypes.IExtensionState {
  // TODO PROT-277: check if creationParameters.paymentAddress is a bitcoin address
  // TODO PROT-277: check if creationParameters.refundAddress is a bitcoin address
  return {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: extensionAction.parameters.paymentAddress,
          refundAddress: extensionAction.parameters.refundAddress,
        },
      },
    ],
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: extensionAction.parameters.paymentAddress,
      refundAddress: extensionAction.parameters.refundAddress,
    },
    version: CURRENT_VERSION,
  };
}

/** Applies add payment address
 *
 * @param extensionState IExtensionState previous state of the extension
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 * @param actionSigner IIdentity identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddPaymentAddress(
  extensionState: ExtensionTypes.IExtensionState,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: RequestLogicTypes.IRequestLogicRequest,
  actionSigner: IdentityTypes.IIdentity,
): ExtensionTypes.IExtensionState {
  // TODO PROT-277: check if creationParameters.paymentAddress is a bitcoin address
  if (extensionState.values.paymentAddress) {
    throw Error(`Payment address already given`);
  }
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }

  const copiedExtensionState: ExtensionTypes.IExtensionState = Utils.deepCopy(extensionState);

  // update payment address
  copiedExtensionState.values.paymentAddress = extensionAction.parameters.paymentAddress;
  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
    parameters: { paymentAddress: extensionAction.parameters.paymentAddress },
  });

  return copiedExtensionState;
}

/** Applies add refund address
 *
 * @param extensionState IExtensionState previous state of the extension
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 * @param actionSigner IIdentity identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddRefundAddress(
  extensionState: ExtensionTypes.IExtensionState,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: RequestLogicTypes.IRequestLogicRequest,
  actionSigner: IdentityTypes.IIdentity,
): ExtensionTypes.IExtensionState {
  // TODO PROT-277: check if creationParameters.refundAddress is a bitcoin address
  if (extensionState.values.refundAddress) {
    throw Error(`Refund address already given`);
  }
  if (!requestState.payer) {
    throw Error(`The request must have a payer`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
    throw Error(`The signer must be the payer`);
  }

  const copiedExtensionState: ExtensionTypes.IExtensionState = Utils.deepCopy(extensionState);

  // update refund address
  copiedExtensionState.values.refundAddress = extensionAction.parameters.refundAddress;
  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
    parameters: { refundAddress: extensionAction.parameters.refundAddress },
  });

  return copiedExtensionState;
}
