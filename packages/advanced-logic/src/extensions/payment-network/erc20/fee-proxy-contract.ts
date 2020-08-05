import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import ReferenceBased from '../reference-based';

const CURRENT_VERSION = '0.1.0';

const walletAddressValidator = require('wallet-address-validator');

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 * With this extension, one request can have three Ethereum addresses (one for payment, one for fees payment, and one for refund)
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
const erc20FeeProxyContract: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = {
  applyActionToExtension,
  createAddFeeAction,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
  isValidAddress,
};

const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Creates the extensionsData to create the extension ERC20 fee proxy contract payment detection
 *
 * @param creationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
): ExtensionTypes.IAction {
  if (creationParameters.paymentAddress && !isValidAddress(creationParameters.paymentAddress)) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  if (creationParameters.refundAddress && !isValidAddress(creationParameters.refundAddress)) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  if (creationParameters.feeAddress && !isValidAddress(creationParameters.feeAddress)) {
    throw Error('feeAddress is not a valid ethereum address');
  }

  if (creationParameters.feeAmount && !Utils.amount.isValid(creationParameters.feeAmount)) {
    throw Error('feeAmount is not a valid amount');
  }

  if (!creationParameters.feeAmount && creationParameters.feeAddress) {
    throw Error('feeAmount requires feeAddress');
  }
  if (creationParameters.feeAmount && !creationParameters.feeAddress) {
    throw Error('feeAddress requires feeAmount');
  }

  return ReferenceBased.createCreationAction(
    ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
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
    ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
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
    ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
    addRefundAddressParameters,
  );
}

/**
 * Creates the extensionsData to add a fee address
 *
 * @param addFeeParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddFeeAction(
  addFeeParameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
): ExtensionTypes.IAction {
  if (addFeeParameters.feeAddress && !isValidAddress(addFeeParameters.feeAddress)) {
    throw Error('feeAddress is not a valid ethereum address');
  }

  if (addFeeParameters.feeAmount && !Utils.amount.isValid(addFeeParameters.feeAmount)) {
    throw Error('feeAmount is not a valid amount');
  }

  if (!addFeeParameters.feeAmount && addFeeParameters.feeAddress) {
    throw Error('feeAmount requires feeAddress');
  }
  if (addFeeParameters.feeAmount && !addFeeParameters.feeAddress) {
    throw Error('feeAddress requires feeAmount');
  }

  return {
    action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
    parameters: addFeeParameters,
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
  if (
    requestState.currency.type !== RequestLogicTypes.CURRENCY.ERC20 ||
    (requestState.currency.network && !supportedNetworks.includes(requestState.currency.network))
  ) {
    throw Error(
      `This extension can be used only on ERC20 requests and on supported networks ${supportedNetworks.join(
        ', ',
      )}`,
    );
  }

  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE) {
    if (requestState.extensions[extensionAction.id]) {
      throw Error(`This extension has already been created`);
    }

    copiedExtensionState[extensionAction.id] = applyCreation(extensionAction, timestamp);

    return copiedExtensionState;
  }

  // if the action is not "create", the state must have been created before
  if (!requestState.extensions[extensionAction.id]) {
    throw Error(`The extension should be created before receiving any other action`);
  }

  if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_PAYMENT_ADDRESS) {
    copiedExtensionState[extensionAction.id] = ReferenceBased.applyAddPaymentAddress(
      isValidAddress,
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_REFUND_ADDRESS) {
    copiedExtensionState[extensionAction.id] = ReferenceBased.applyAddRefundAddress(
      isValidAddress,
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE) {
    copiedExtensionState[extensionAction.id] = applyAddFee(
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
 * Applies a creation extension action
 *
 * @param extensionAction action to apply
 * @param timestamp action timestamp
 *
 * @returns state of the extension created
 */
function applyCreation(
  extensionAction: ExtensionTypes.IAction,
  timestamp: number,
): ExtensionTypes.IState {
  if (!extensionAction.version) {
    throw Error('version is missing');
  }
  if (!extensionAction.parameters.paymentAddress) {
    throw Error('salt is missing');
  }
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
  if (
    extensionAction.parameters.feeAddress &&
    !isValidAddress(extensionAction.parameters.feeAddress)
  ) {
    throw Error('feeAddress is not a valid address');
  }
  if (
    extensionAction.parameters.feeAmount &&
    !Utils.amount.isValid(extensionAction.parameters.feeAmount)
  ) {
    throw Error('feeAmount is not a valid amount');
  }
  return {
    events: [
      {
        name: 'create',
        parameters: {
          feeAddress: extensionAction.parameters.feeAddress,
          feeAmount: extensionAction.parameters.feeAmount,
          paymentAddress: extensionAction.parameters.paymentAddress,
          refundAddress: extensionAction.parameters.refundAddress,
          salt: extensionAction.parameters.salt,
        },
        timestamp,
      },
    ],
    id: extensionAction.id,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      feeAddress: extensionAction.parameters.feeAddress,
      feeAmount: extensionAction.parameters.feeAmount,
      paymentAddress: extensionAction.parameters.paymentAddress,
      refundAddress: extensionAction.parameters.refundAddress,
      salt: extensionAction.parameters.salt,
    },
    version: extensionAction.version,
  };
}

/**
 * Applies an add fee address and amount extension action
 *
 * @param extensionState previous state of the extension
 * @param extensionAction action to apply
 * @param requestState request state read-only
 * @param actionSigner identity of the signer
 * @param timestamp action timestamp
 *
 * @returns state of the extension updated
 */
function applyAddFee(
  extensionState: ExtensionTypes.IState,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): ExtensionTypes.IState {
  if (
    extensionAction.parameters.feeAddress &&
    !isValidAddress(extensionAction.parameters.feeAddress)
  ) {
    throw Error('feeAddress is not a valid address');
  }
  if (extensionState.values.feeAddress) {
    throw Error(`Fee address already given`);
  }
  if (
    extensionAction.parameters.feeAmount &&
    !Utils.amount.isValid(extensionAction.parameters.feeAmount)
  ) {
    throw Error('feeAmount is not a valid amount');
  }
  if (extensionState.values.feeAmount) {
    throw Error(`Fee amount already given`);
  }
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }

  const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

  // update fee address and amount
  copiedExtensionState.values.feeAddress = extensionAction.parameters.feeAddress;
  copiedExtensionState.values.feeAmount = extensionAction.parameters.feeAmount;

  // update events
  copiedExtensionState.events.push({
    name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
    parameters: {
      feeAddress: extensionAction.parameters.feeAddress,
      feeAmount: extensionAction.parameters.feeAmount,
    },
    timestamp,
  });

  return copiedExtensionState;
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

export default erc20FeeProxyContract;
