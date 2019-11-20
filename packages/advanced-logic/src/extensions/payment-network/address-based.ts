import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/**
 * Core of the address based payment networks
 * This module is called by the address based payment networks to avoid code redundancy
 */
export default {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
};

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData for address based payment networks
 *
 * @param extensions extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  extensionId: ExtensionTypes.ID,
  creationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAddressBased.ACTION.CREATE,
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
  addPaymentAddressParameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
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
  addRefundAddressParameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
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
 * @param isValidAddress address validator function
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  isValidAddress: (address: string) => boolean,
  extensionsState: RequestLogicTypes.IExtensionStates,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): RequestLogicTypes.IExtensionStates {
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  if (extensionAction.action === ExtensionTypes.PnAddressBased.ACTION.CREATE) {
    if (requestState.extensions[extensionAction.id]) {
      throw Error(`This extension has already been created`);
    }

    copiedExtensionState[extensionAction.id] = applyCreation(
      isValidAddress,
      extensionAction,
      timestamp,
    );

    return copiedExtensionState;
  }

  // if the action is not "create", the state must have been created before
  if (!requestState.extensions[extensionAction.id]) {
    throw Error(`The extension should be created before receiving any other action`);
  }

  if (extensionAction.action === ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddPaymentAddress(
      isValidAddress,
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddRefundAddress(
      isValidAddress,
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

/**
 * Applies a creation
 *
 * @param isValidAddress address validator function
 * @param extensionAction action to apply
 *
 * @returns state of the extension created
 */
function applyCreation(
  isValidAddress: (address: string) => boolean,
  extensionAction: ExtensionTypes.IAction,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.paymentAddress &&
    !isValidAddress(extensionAction.parameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid address');
  }
  if (
    extensionAction.parameters.refundAddress &&
    !isValidAddress(extensionAction.parameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid address');
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

/**
 * Applies add payment address
 *
 * @param isValidAddress address validator function
 * @param extensionState previous state of the extension
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddPaymentAddress(
  isValidAddress: (address: string) => boolean,
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.paymentAddress &&
    !isValidAddress(extensionAction.parameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid address');
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
    name: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
    parameters: { paymentAddress: extensionAction.parameters.paymentAddress },
    timestamp,
  });

  return copiedExtensionState;
}

/**
 * Applies add refund address
 *
 * @param isValidAddress address validator function
 * @param extensionState previous state of the extension
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 *
 * @returns state of the extension updated
 */
function applyAddRefundAddress(
  isValidAddress: (address: string) => boolean,
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.refundAddress &&
    !isValidAddress(extensionAction.parameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid address');
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
    name: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
    parameters: { refundAddress: extensionAction.parameters.refundAddress },
    timestamp,
  });

  return copiedExtensionState;
}
