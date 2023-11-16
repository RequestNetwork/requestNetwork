import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import EthereumFeeProxyPaymentNetwork from './ethereum/fee-proxy-contract';

const CURRENT_VERSION = '0.2.0';

export default class AnyToEthProxyPaymentNetwork extends EthereumFeeProxyPaymentNetwork {
  public constructor(private currencyManager: CurrencyTypes.ICurrencyManager) {
    super(ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY, CURRENT_VERSION);
  }

  /**
   * Creates the extensionsData to create the extension ETH fee proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: ExtensionTypes.PnAnyToEth.ICreationParameters,
  ): ExtensionTypes.IAction {
    this.throwIfInvalidNetwork(creationParameters.network);
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
            maxRateTimespan: extensionAction.parameters.maxRateTimespan,
          },
          timestamp,
        },
      ],
      values: {
        ...feePNCreationAction.values,
        network: extensionAction.parameters.network,
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
      throw new Error(
        `The network must be provided from the creation action or from the extension state`,
      );
    }

    const currency = this.currencyManager.fromStorageCurrency(request.currency);
    if (!currency) {
      throw new UnsupportedCurrencyError(request.currency);
    }
    if (!this.currencyManager.supportsConversion(currency, network)) {
      throw new Error(
        `The currency (${request.currency.value}) of the request is not supported for this payment network.`,
      );
    }
  }
}
