import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import {
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { areEqualIdentities, deepCopy } from '@requestnetwork/utils';
import DeclarativePaymentNetwork from './declarative';

/**
 * Core of the address based payment networks
 * This module is called by the address based payment networks to avoid code redundancy
 */
export default abstract class AddressBasedPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnAddressBased.ICreationParameters = ExtensionTypes.PnAddressBased.ICreationParameters,
> extends DeclarativePaymentNetwork<TCreationParameters> {
  protected constructor(
    protected currencyManager: CurrencyTypes.ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
    currentVersion: string,
    public readonly supportedCurrencyType: RequestLogicTypes.CURRENCY,
  ) {
    super(extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS]:
        this.applyAddPaymentAddress.bind(this),
      [ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS]:
        this.applyAddRefundAddress.bind(this),
    };
  }

  /**
   * Creates the extensionsData for address based payment networks
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.paymentAddress);
    }

    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.refundAddress, 'refundAddress');
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
  }

  /**
   * Creates the extensionsData to add a payment address
   *
   * @param addPaymentAddressParameters extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddPaymentAddressAction(
    addPaymentAddressParameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    const paymentAddress = addPaymentAddressParameters.paymentAddress;
    if (paymentAddress && !this.isValidAddress(paymentAddress)) {
      throw new InvalidPaymentAddressError(paymentAddress);
    }

    return {
      action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
      id: this.extensionId,
      parameters: {
        paymentAddress,
      },
    };
  }

  /**
   * Creates the extensionsData to add a refund address
   *
   * @param addRefundAddressParameters extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddRefundAddressAction(
    addRefundAddressParameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    const refundAddress = addRefundAddressParameters.refundAddress;
    if (refundAddress && !this.isValidAddress(refundAddress)) {
      throw new InvalidPaymentAddressError(refundAddress, 'refundAddress');
    }

    return {
      action: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
      id: this.extensionId,
      parameters: {
        refundAddress,
      },
    };
  }

  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    const paymentAddress = extensionAction.parameters.paymentAddress;
    const refundAddress = extensionAction.parameters.refundAddress;
    if (paymentAddress && !this.isValidAddress(paymentAddress)) {
      throw new InvalidPaymentAddressError(paymentAddress);
    }
    if (refundAddress && !this.isValidAddress(refundAddress)) {
      throw new InvalidPaymentAddressError(refundAddress, 'refundAddress');
    }

    const genericCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...genericCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress,
            refundAddress,
          },
          timestamp,
        },
      ],
      id: this.extensionId,
      type: this.extensionType,
      values: {
        ...genericCreationAction.values,
        paymentAddress,
        refundAddress,
      },
    };
  }

  protected isValidAddress(address: string): boolean {
    switch (this.supportedCurrencyType) {
      case RequestLogicTypes.CURRENCY.ETH:
      case RequestLogicTypes.CURRENCY.ERC20:
      case RequestLogicTypes.CURRENCY.ERC777:
        return this.isValidAddressForSymbolAndNetwork(address, 'ETH', 'mainnet');
      default:
        throw new Error(
          `Default implementation of isValidAddressForNetwork() does not support currency type ${this.supportedCurrencyType}. Please override this method if needed.`,
        );
    }
  }

  protected isValidAddressForSymbolAndNetwork(
    address: string,
    symbol: string,
    network: CurrencyTypes.ChainName,
  ): boolean {
    const currency = this.currencyManager.from(symbol, network);
    if (!currency) {
      throw new UnsupportedCurrencyError({ value: symbol, network });
    }
    return this.currencyManager.validateAddress(address, currency);
  }

  /**
   * Applies the add payment address action
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the extension updated
   */
  protected applyAddPaymentAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.paymentAddress &&
      !this.isValidAddress(extensionAction.parameters.paymentAddress)
    ) {
      throw new InvalidPaymentAddressError(extensionAction.parameters.paymentAddress);
    }
    if (extensionState.values.paymentAddress) {
      throw Error(`Payment address already given`);
    }
    if (!requestState.payee) {
      throw Error(`The request must have a payee`);
    }
    if (!areEqualIdentities(actionSigner, requestState.payee)) {
      throw Error(`The signer must be the payee`);
    }

    const copiedExtensionState: ExtensionTypes.IState = deepCopy(extensionState);

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
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the extension updated
   */
  protected applyAddRefundAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.refundAddress &&
      !this.isValidAddress(extensionAction.parameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid address');
    }
    if (extensionState.values.refundAddress) {
      throw Error(`Refund address already given`);
    }
    if (!requestState.payer) {
      throw Error(`The request must have a payer`);
    }
    if (!areEqualIdentities(actionSigner, requestState.payer)) {
      throw Error(`The signer must be the payer`);
    }

    const copiedExtensionState: ExtensionTypes.IState = deepCopy(extensionState);

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

  protected validate(
    request: RequestLogicTypes.IRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extensionAction: ExtensionTypes.IAction,
  ): void {
    if (request.currency.type !== this.supportedCurrencyType) {
      throw Error(`This extension can be used only on ${this.supportedCurrencyType} requests`);
    }
    this.throwIfInvalidNetwork(request.currency.network);
  }

  protected throwIfInvalidNetwork(network?: string): asserts network is string {
    if (!network) {
      throw Error('network is required');
    }
  }
}

export class InvalidPaymentAddressError extends Error {
  constructor(address?: string, addressReference = 'paymentAddress') {
    const formattedAddress = address ? ` '${address}'` : '';
    super(`${addressReference}${formattedAddress} is not a valid address`);
  }
}

export class UnsupportedNetworkError extends Error {
  constructor(unsupportedNetworkName: string, supportedNetworks?: string[]) {
    const supportedNetworkDetails = supportedNetworks
      ? ` (only ${supportedNetworks.join(', ')})`
      : '';
    super(
      `Payment network '${unsupportedNetworkName}' is not supported by this extension${supportedNetworkDetails}`,
    );
  }
}
