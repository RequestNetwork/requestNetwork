import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Core of the declarative payment network
 */
const pnDeclarative: ExtensionTypes.PnAnyDeclarative.IAnyDeclarative = {
  applyActionToExtension,
  createAddPaymentInstructionAction,
  createAddRefundInstructionAction,
  createCreationAction,
  createDeclareReceivedPaymentAction,
  createDeclareReceivedRefundAction,
  createDeclareSentPaymentAction,
  createDeclareSentRefundAction,
};
export default pnDeclarative;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData for the declarative payment network extension
 *
 * @param parameters parameters to create extension
 *
 * @returns the extensionsData to be stored in the request
 */
function createCreationAction(
  parameters?: ExtensionTypes.PnAnyDeclarative.ICreationParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      paymentInfo: parameters && parameters.paymentInfo,
      refundInfo: parameters && parameters.refundInfo,
    },
    version: CURRENT_VERSION,
  };
}

/**
 * Creates the extensionsData to add a sent payment declaration
 *
 * @param parameters parameters to create sent payment declaration
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createDeclareSentPaymentAction(
  parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      amount: parameters.amount.toString(),
      note: parameters.note,
    },
  };
}

/**
 * Creates the extensionsData to add a sent refund declaration
 *
 * @param parameters parameters to create sent refund declaration
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createDeclareSentRefundAction(
  parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      amount: parameters.amount.toString(),
      note: parameters.note,
    },
  };
}

/**
 * Creates the extensionsData to add a received payment declaration
 *
 * @param parameters parameters to create received payment declaration
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createDeclareReceivedPaymentAction(
  parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      amount: parameters.amount.toString(),
      note: parameters.note,
    },
  };
}

/**
 * Creates the extensionsData to add a received refund declaration
 *
 * @param parameters parameters to create received refund declaration
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createDeclareReceivedRefundAction(
  parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      amount: parameters.amount.toString(),
      note: parameters.note,
    },
  };
}

/**
 * Creates the extensionsData to add payment instruction
 *
 * @param extensions extensions parameters to add payment instruction
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddPaymentInstructionAction(
  parameters: ExtensionTypes.PnAnyDeclarative.IAddPaymentInstructionParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      paymentInfo: parameters.paymentInfo,
    },
  };
}

/**
 * Creates the extensionsData to add refund instruction
 *
 * @param extensions extensions parameters to add refund instruction
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddRefundInstructionAction(
  parameters: ExtensionTypes.PnAnyDeclarative.IAddRefundInstructionParameters,
): ExtensionTypes.IAction {
  return {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    parameters: {
      refundInfo: parameters.refundInfo,
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
 * @param timestamp timestamp of the action
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
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.CREATE) {
    if (requestState.extensions[extensionAction.id]) {
      throw Error(`This extension has already been created`);
    }

    copiedExtensionState[extensionAction.id] = applyCreation(extensionAction, timestamp);

    return copiedExtensionState;
  }

  // if the action is not "create", the state must have been created before
  if (!requestState.extensions[extensionAction.id]) {
    throw Error(`This extension must have been already created`);
  }

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT) {
    copiedExtensionState[extensionAction.id] = applyDeclareSentPayment(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND) {
    copiedExtensionState[extensionAction.id] = applyDeclareSentRefund(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT) {
    copiedExtensionState[extensionAction.id] = applyDeclareReceivedPayment(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND) {
    copiedExtensionState[extensionAction.id] = applyDeclareReceivedRefund(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION) {
    copiedExtensionState[extensionAction.id] = applyAddPaymentInstruction(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
    return copiedExtensionState;
  }
  if (extensionAction.action === ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION) {
    copiedExtensionState[extensionAction.id] = applyAddRefundInstruction(
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
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyCreation(
  extensionAction: ExtensionTypes.IAction,
  timestamp: number,
): ExtensionTypes.IState {
  return {
    events: [
      {
        name: 'create',
        parameters: {
          paymentInfo: extensionAction.parameters.paymentInfo,
          refundInfo: extensionAction.parameters.refundInfo,
        },
        timestamp,
      },
    ],
    id: extensionAction.id,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentInfo: extensionAction.parameters.paymentInfo,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo: extensionAction.parameters.refundInfo,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: CURRENT_VERSION,
  };
}

/** Applies a declare sent payment
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyDeclareSentPayment(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (!requestState.payer) {
    throw Error(`The request must have a payer`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
    throw Error(`The signer must be the payer`);
  }
  if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
    throw Error(`The amount is not a valid amount`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment sentPaymentAmount
  copiedExtensionState.values.sentPaymentAmount = Utils.amount.add(
    copiedExtensionState.values.sentPaymentAmount,
    extensionAction.parameters.amount,
  );

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
    parameters: {
      amount: extensionAction.parameters.amount,
      note: extensionAction.parameters.note,
    },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies a declare sent refund
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyDeclareSentRefund(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }
  if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
    throw Error(`The amount is not a valid amount`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment sentRefundAmount
  copiedExtensionState.values.sentRefundAmount = Utils.amount.add(
    copiedExtensionState.values.sentRefundAmount,
    extensionAction.parameters.amount,
  );

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
    parameters: {
      amount: extensionAction.parameters.amount,
      note: extensionAction.parameters.note,
    },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies a declare received payment
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyDeclareReceivedPayment(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }
  if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
    throw Error(`The amount is not a valid amount`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment receivedPaymentAmount
  copiedExtensionState.values.receivedPaymentAmount = Utils.amount.add(
    copiedExtensionState.values.receivedPaymentAmount,
    extensionAction.parameters.amount,
  );

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
    parameters: {
      amount: extensionAction.parameters.amount,
      note: extensionAction.parameters.note,
    },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies a declare received refund
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyDeclareReceivedRefund(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (!requestState.payer) {
    throw Error(`The request must have a payer`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
    throw Error(`The signer must be the payer`);
  }
  if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
    throw Error(`The amount is not a valid amount`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment receivedRefundAmount
  copiedExtensionState.values.receivedRefundAmount = Utils.amount.add(
    copiedExtensionState.values.receivedRefundAmount,
    extensionAction.parameters.amount,
  );

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
    parameters: {
      amount: extensionAction.parameters.amount,
      note: extensionAction.parameters.note,
    },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies an add of payment instruction
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyAddPaymentInstruction(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (extensionState.values.paymentInfo) {
    throw Error(`The payment instruction already given`);
  }
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment paymentInfo
  copiedExtensionState.values.paymentInfo = extensionAction.parameters.paymentInfo;

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
    parameters: {
      paymentInfo: extensionAction.parameters.paymentInfo,
    },
    timestamp,
  });

  return copiedExtensionState;
}

/** Applies an add of refund instruction
 *
 * @param extensionsState previous state of the extensions
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp timestamp of the action
 *
 * @returns state of the extension created
 */
function applyAddRefundInstruction(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (extensionState.values.refundInfo) {
    throw Error(`The refund instruction already given`);
  }
  if (!requestState.payer) {
    throw Error(`The request must have a payer`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
    throw Error(`The signer must be the payer`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // increment refundInfo
  copiedExtensionState.values.refundInfo = extensionAction.parameters.refundInfo;

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
    parameters: {
      refundInfo: extensionAction.parameters.refundInfo,
    },
    timestamp,
  });

  return copiedExtensionState;
}
