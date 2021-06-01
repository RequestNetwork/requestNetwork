import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Erc20FeeProxyPaymentNetwork from './erc20/fee-proxy-contract';

const CURRENT_VERSION = '0.1.0';
// Default network if the storage data does not give any
const DEFAULT_NETWORK = 'mainnet';

/**
 * These currencies are supported by Chainlink for conversion.
 * Only ERC20 is supported as accepted token by the payment proxy.
 */
const supportedCurrencies: Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> = {
  private: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['USD', 'EUR'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0x38cf23c52bb4b13f051aec09580a2de845a7fa35'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  rinkeby: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['EUR', 'GBP', 'USD'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0xfab46e002bbf0b4509813474841e0716e6730136'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  mainnet: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'SGD', 'USD'],
    [RequestLogicTypes.CURRENCY.ERC20]: [
      '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
      '0x3845badade8e6dff049820680d1f14bd3903a5d0',
      '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      '0x8290333cef9e6d528dd5618fb97a76f268f3edd4',
      '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
      '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0xa117000000f279d81a1d3cc75430faa017fa5a2e',
      '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
};

export default class AnyToErc20ProxyPaymentNetwork extends Erc20FeeProxyPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion, [], RequestLogicTypes.CURRENCY.ERC20);
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
    if (!network) {
      throw Error('network is required');
    }
    if (!supportedCurrencies[network]) {
      throw Error(`network ${network} not supported`);
    }
    const supportedErc20: string[] = supportedCurrencies[network][RequestLogicTypes.CURRENCY.ERC20];

    for (const address of creationParameters.acceptedTokens) {
      if (!supportedErc20.includes(address.toLowerCase())) {
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
            network: extensionAction.parameters.network || DEFAULT_NETWORK,
            acceptedTokens: extensionAction.parameters.acceptedTokens,
            maxRateTimespan: extensionAction.parameters.maxRateTimespan,
          },
          timestamp,
        },
      ],
      values: {
        ...feePNCreationAction.values,
        network: extensionAction.parameters.network || DEFAULT_NETWORK,
        acceptedTokens: extensionAction.parameters.acceptedTokens,
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
