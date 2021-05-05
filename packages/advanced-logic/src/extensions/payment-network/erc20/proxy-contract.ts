import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ReferenceBased from '../reference-based';

const CURRENT_VERSION = '0.1.0';

import * as walletAddressValidator from 'wallet-address-validator';

const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
export default class Erc20ProxyPaymentNetwork {
  public currentVersion;
  public paymentNetworkId;
  public actions: { [actionId: string]: ExtensionTypes.ApplyAction };

  public constructor() {
    this.currentVersion = CURRENT_VERSION;
    this.paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT;
    this.actions = {
      [ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS]: this.applyAddPaymentAddress,
      [ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS]: this.applyAddRefundAddress,
    };
  }

  /**
   * Creates the extensionsData to create the extension ERC20 proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: ExtensionTypes.PnReferenceBased.ICreationParameters,
  ): ExtensionTypes.IAction {
    if (
      creationParameters.paymentAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(creationParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid ethereum address');
    }

    if (
      creationParameters.refundAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(creationParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid ethereum address');
    }

    return ReferenceBased.createCreationAction(
      this.paymentNetworkId,
      creationParameters,
      this.currentVersion,
    );
  }

  /**
   * Creates the extensionsData to add a payment address
   *
   * @param addPaymentAddressParameters extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddPaymentAddressAction(
    addPaymentAddressParameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    if (
      addPaymentAddressParameters.paymentAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(addPaymentAddressParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid ethereum address');
    }

    return ReferenceBased.createAddPaymentAddressAction(
      this.paymentNetworkId,
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
  public createAddRefundAddressAction(
    addRefundAddressParameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    if (
      addRefundAddressParameters.refundAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(addRefundAddressParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid ethereum address');
    }

    return ReferenceBased.createAddRefundAddressAction(
      this.paymentNetworkId,
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
  public applyActionToExtension(
    extensionsState: RequestLogicTypes.IExtensionStates,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): RequestLogicTypes.IExtensionStates {
    this.validateSupportedCurrency(requestState, extensionAction);

    const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(
      extensionsState,
    );

    if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE) {
      if (requestState.extensions[extensionAction.id]) {
        throw Error(`This extension has already been created`);
      }

      copiedExtensionState[extensionAction.id] = this.applyCreation(extensionAction, timestamp);

      return copiedExtensionState;
    }

    // if the action is not "create", the state must have been created before
    if (!requestState.extensions[extensionAction.id]) {
      throw Error(`The extension should be created before receiving any other action`);
    }

    const actionToApply: ExtensionTypes.ApplyAction = this.actions[extensionAction.action];

    if (!actionToApply) {
      throw Error(`Unknown action: ${extensionAction.action}`);
    }

    copiedExtensionState[extensionAction.id] = actionToApply(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  /**
   * Check if an ethereum address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  public static isValidAddress(address: string): boolean {
    return walletAddressValidator.validate(address, 'ethereum');
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp action timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!extensionAction.version) {
      throw Error('version is missing');
    }
    if (!extensionAction.parameters.paymentAddress) {
      throw Error('paymentAddress is missing');
    }
    if (!extensionAction.parameters.salt) {
      throw Error('salt is missing');
    }
    if (
      extensionAction.parameters.paymentAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(extensionAction.parameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid address');
    }
    if (
      extensionAction.parameters.refundAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(extensionAction.parameters.refundAddress)
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
        salt: extensionAction.parameters.salt,
      },
      version: extensionAction.version,
    };
  }

  protected applyAddRefundAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    return ReferenceBased.applyAddRefundAddress(
      Erc20ProxyPaymentNetwork.isValidAddress,
      extensionState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }

  protected applyAddPaymentAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    return ReferenceBased.applyAddPaymentAddress(
      Erc20ProxyPaymentNetwork.isValidAddress,
      extensionState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }

  protected validateSupportedCurrency(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      request.currency.type !== RequestLogicTypes.CURRENCY.ERC20 ||
      (request.currency.network &&
        extensionAction.parameters.network === request.currency.network &&
        !supportedNetworks.includes(request.currency.network))
    ) {
      throw Error(
        `This extension can be used only on ERC20 requests and on supported networks ${supportedNetworks.join(
          ', ',
        )}`,
      );
    }
  }
}
