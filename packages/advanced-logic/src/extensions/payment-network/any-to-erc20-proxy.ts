import { conversionSupportedNetworks, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Erc20FeeProxyPaymentNetwork from './erc20/fee-proxy-contract';

const CURRENT_VERSION = '0.1.0';

export default class AnyToErc20ProxyPaymentNetwork extends Erc20FeeProxyPaymentNetwork {
  public constructor(
    private currencyManager: CurrencyTypes.ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ANY_TO_ERC20_PROXY,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion);
  }

  /**
   * Creates the extensionsData to create the extension ERC20 fee proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: ExtensionTypes.PnAnyToErc20.ICreationParameters,
  ): ExtensionTypes.IAction {
    if (!creationParameters.acceptedTokens || creationParameters.acceptedTokens.length === 0) {
      throw Error('acceptedTokens is required');
    }
    if (creationParameters.acceptedTokens.some((address) => !this.isValidAddress(address))) {
      throw Error('acceptedTokens must contains only valid ethereum addresses');
    }
    const network = creationParameters.network;
    this.throwIfInvalidNetwork(network);

    for (const address of creationParameters.acceptedTokens) {
      const acceptedCurrency = this.currencyManager.fromAddress(address, network);
      if (!acceptedCurrency) {
        throw new UnsupportedCurrencyError({
          value: address,
          network,
        });
      }
      if (!this.currencyManager.supportsConversion(acceptedCurrency, network)) {
        throw Error(
          `acceptedTokens must contain only supported token addresses (ERC20 only). ${address} is not supported for ${network}.`,
        );
      }
    }

    return super.createCreationAction(creationParameters);
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
    if (!extensionAction.parameters.network || extensionAction.parameters.network.length === 0) {
      throw Error('network is required');
    }

    if (
      !extensionAction.parameters.acceptedTokens ||
      extensionAction.parameters.acceptedTokens.length === 0
    ) {
      throw Error('acceptedTokens is required and cannot be empty');
    }
    if (
      extensionAction.parameters.acceptedTokens.some(
        (address: string) => !this.isValidAddress(address),
      )
    ) {
      throw Error('acceptedTokens must contains only valid ethereum addresses');
    }

    const feePNCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...feePNCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            feeAddress: extensionAction.parameters.feeAddress,
            feeAmount: extensionAction.parameters.feeAmount,
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
            network: extensionAction.parameters.network,
            acceptedTokens: extensionAction.parameters.acceptedTokens,
            maxRateTimespan: extensionAction.parameters.maxRateTimespan,
          },
          timestamp,
        },
      ],
      values: {
        ...feePNCreationAction.values,
        network: extensionAction.parameters.network,
        acceptedTokens: extensionAction.parameters.acceptedTokens,
        maxRateTimespan: extensionAction.parameters.maxRateTimespan,
      },
    };
  }

  /**
   * Validate the extension action regarding the currency and network
   * It must throw in case of error
   */
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    const network =
      extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE
        ? extensionAction.parameters.network
        : request.extensions[this.extensionId]?.values.network;
    if (!network) {
      return;
    }

    // Nothing can be validated if the network has not been given yet
    if (!network) {
      return;
    }

    if (!conversionSupportedNetworks.includes(network)) {
      throw new Error(`The network (${network}) is not supported for this payment network.`);
    }

    const currency = this.currencyManager.fromStorageCurrency(request.currency);
    if (!currency) {
      throw new UnsupportedCurrencyError(request.currency);
    }
    if (!this.currencyManager.supportsConversion(currency, network)) {
      throw new Error(
        `The currency (${currency.id}, ${currency.hash}) of the request is not supported for this payment network.`,
      );
    }
  }
}
