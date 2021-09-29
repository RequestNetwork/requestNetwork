import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import EthereumFeeProxyPaymentNetwork from './ethereum/fee-proxy-contract';
import { supportedCurrencies } from './chainlink-supported-currencies';

const CURRENT_VERSION = '0.1.0';
// Default network if the storage data does not give any
const DEFAULT_NETWORK = 'mainnet';

export default class AnyToEthProxyPaymentNetwork extends EthereumFeeProxyPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion, Object.keys(supportedCurrencies));
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
    const network = creationParameters.network;
    if (!network) {
      throw Error('network is required');
    }
    if (!supportedCurrencies[network]) {
      throw Error(`network ${network} not supported`);
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
            network: extensionAction.parameters.network || DEFAULT_NETWORK,
            maxRateTimespan: extensionAction.parameters.maxRateTimespan,
          },
          timestamp,
        },
      ],
      values: {
        ...feePNCreationAction.values,
        network: extensionAction.parameters.network || DEFAULT_NETWORK,
        maxRateTimespan: extensionAction.parameters.maxRateTimespan,
      },
    };
  }

  /**
   * Validate the extension action regarding the currency and network
   * It must throw in case of error
   *
   * @param request
   */
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    const network =
      extensionAction.parameters.network || request.extensions[this.extensionId]?.values.network;

    // Nothing can be validated if the network has not been given yet
    if (!network) {
      return;
    }

    if (!supportedCurrencies[network]) {
      throw new Error(`The network (${network}) is not supported for this payment network.`);
    }

    if (!supportedCurrencies[network][request.currency.type]) {
      throw new Error(
        `The currency type (${request.currency.type}) of the request is not supported for this payment network.`,
      );
    }

    const currency =
      request.currency.type === RequestLogicTypes.CURRENCY.ERC20
        ? request.currency.value.toLowerCase()
        : request.currency.value;

    if (!supportedCurrencies[network][request.currency.type].includes(currency)) {
      throw new Error(
        `The currency (${request.currency.value}) of the request is not supported for this payment network.`,
      );
    }
  }
}
