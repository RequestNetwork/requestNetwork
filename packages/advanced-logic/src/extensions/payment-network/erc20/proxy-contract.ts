import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBased from '../reference-based';

import * as walletAddressValidator from 'wallet-address-validator';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
export default class Erc20ProxyPaymentNetwork
  implements ExtensionTypes.PnReferenceBased.IReferenceBased {
  public supportedNetworks = ['mainnet', 'rinkeby', 'private'];
  public version = CURRENT_VERSION;
  public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT;

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
      !this.isValidAddress(creationParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid ethereum address');
    }

    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid ethereum address');
    }

    return ReferenceBased.createCreationAction(this.extensionId, creationParameters, this.version);
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
      !this.isValidAddress(addPaymentAddressParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid ethereum address');
    }

    return ReferenceBased.createAddPaymentAddressAction(
      ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
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
      !this.isValidAddress(addRefundAddressParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid ethereum address');
    }

    return ReferenceBased.createAddRefundAddressAction(
      ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
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
    if (
      requestState.currency.type !== RequestLogicTypes.CURRENCY.ERC20 ||
      (requestState.currency.network &&
        !this.supportedNetworks.includes(requestState.currency.network))
    ) {
      throw Error(
        `This extension can be used only on ERC20 requests and on supported networks ${this.supportedNetworks.join(
          ', ',
        )}`,
      );
    }

    return ReferenceBased.applyActionToExtension(
      this.isValidAddress,
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
  public isValidAddress(address: string): boolean {
    return walletAddressValidator.validate(address, 'ethereum');
  }
}
