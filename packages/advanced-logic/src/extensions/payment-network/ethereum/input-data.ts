import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

const walletAddressValidator = require('wallet-address-validator');

/**
 * Implementation of the payment network to pay in ETH based on input data.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ETH ethereum transaction that reaches these addresses and has the correct input data will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
const ethInputData: ExtensionTypes.PnEthInputData.IEthInputData = {
  applyActionToExtension,
  createAddPaymentAddressAction,
  createAddRefundAddressAction,
  createCreationAction,
  isValidAddress,
};

const supportedNetworks = ['mainnet', 'rinkeby'];

// Regex for "at least 16 hexadecimal numbers". Used to validate the salt
const eightHexRegex = /[0-9a-f]{16,}/;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData to create the ETH payment detection extension
 *
 * @param creationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be stored in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PnEthInputData.ICreationParameters,
): ExtensionTypes.IAction {
  if (creationParameters.paymentAddress && !isValidAddress(creationParameters.paymentAddress)) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  if (creationParameters.refundAddress && !isValidAddress(creationParameters.refundAddress)) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  if (!creationParameters.salt) {
    throw Error('salt should not be empty');
  }

  if (!eightHexRegex.test(creationParameters.salt)) {
    /* eslint-disable spellcheck/spell-checker */
    throw Error(
      `salt be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
    );
  }

  return {
    action: ExtensionTypes.PnAddressBased.ACTION.CREATE,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    parameters: creationParameters,
    version: CURRENT_VERSION,
  };
}

/**
 * Creates the extensionsData to add a payment address
 *
 * @param addPaymentAddressParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddPaymentAddressAction(
  addPaymentAddressParameters: ExtensionTypes.PnEthInputData.IAddPaymentAddressParameters,
): ExtensionTypes.IAction {
  if (
    addPaymentAddressParameters.paymentAddress &&
    !isValidAddress(addPaymentAddressParameters.paymentAddress)
  ) {
    throw Error('paymentAddress is not a valid ethereum address');
  }

  return {
    action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    parameters: addPaymentAddressParameters,
  };
}

/**
 * Creates the extensionsData to add a refund address
 *
 * @param addRefundAddressParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be stored in the request
 */
function createAddRefundAddressAction(
  addRefundAddressParameters: ExtensionTypes.PnEthInputData.IAddRefundAddressParameters,
): ExtensionTypes.IAction {
  if (
    addRefundAddressParameters.refundAddress &&
    !isValidAddress(addRefundAddressParameters.refundAddress)
  ) {
    throw Error('refundAddress is not a valid ethereum address');
  }

  return {
    action: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    parameters: addRefundAddressParameters,
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
    requestState.currency.type !== RequestLogicTypes.CURRENCY.ETH ||
    (requestState.currency.network && !supportedNetworks.includes(requestState.currency.network))
  ) {
    throw Error(
      `This extension can be used only on ETH requests and on supported networks ${supportedNetworks.join(
        ', ',
      )}`,
    );
  }

  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  if (extensionAction.action === ExtensionTypes.PnEthInputData.ACTION.CREATE) {
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

  if (extensionAction.action === ExtensionTypes.PnEthInputData.ACTION.ADD_PAYMENT_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddPaymentAddress(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  if (extensionAction.action === ExtensionTypes.PnEthInputData.ACTION.ADD_REFUND_ADDRESS) {
    copiedExtensionState[extensionAction.id] = applyAddRefundAddress(
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
          salt: extensionAction.parameters.salt,
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
