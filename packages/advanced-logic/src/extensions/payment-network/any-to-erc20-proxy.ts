import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import { erc20FeeProxyPaymentNetwork } from './erc20/fee-proxy-contract';

const CURRENT_VERSION = '0.1.0';

/**
 * These currencies are supported by Chainlink for conversion.
 * Only ERC20 is supported as accepted token by the payment proxy.
 */
const supportedCurrencies: Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> = {
  private: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['USD', 'EUR'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  rinkeby: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['USD', 'EUR'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  mainnet: {
    [RequestLogicTypes.CURRENCY.ISO4217]: [],
    [RequestLogicTypes.CURRENCY.ERC20]: [],
    [RequestLogicTypes.CURRENCY.ETH]: [],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
};

export class anyToErc20ProxyPaymentNetwork extends erc20FeeProxyPaymentNetwork {
  public constructor() {
    super();
    this.currentVersion = CURRENT_VERSION;
    this.paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY;
  }

  /**
   * Creates the extensionsData to create the extension Any to ERC20
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(creationParameters: ExtensionTypes.PnAnyToErc20.ICreationParameters) {
    if (!creationParameters.acceptedTokens || creationParameters.acceptedTokens.length === 0) {
      throw Error('acceptedTokens is required');
    }
    if (
      creationParameters.acceptedTokens.some((address: string) => !this.isValidAddress(address))
    ) {
      throw Error('acceptedTokens must contains only valid ethereum addresses');
    }

    const network = creationParameters.network;
    if (!network) {
      throw Error('network is required');
    }
    if (!supportedCurrencies[network]) {
      throw Error('network not supported');
    }

    const supportedErc20: string[] = supportedCurrencies[network][RequestLogicTypes.CURRENCY.ERC20];
    if (
      creationParameters.acceptedTokens.some((address: string) => !supportedErc20.includes(address))
    ) {
      throw Error('acceptedTokens must contain only supported token addresses (ERC20 only)');
    }
    return super.createCreationAction(creationParameters);
  }

  /**
   * Applies the extension action to the request state
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
    return super.applyActionToExtension(
      extensionsState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
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
      throw Error('acceptedTokens is required');
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
   * Validates the payment network of the request currency.
   *
   * @param currency
   */
  protected validateSupportedCurrency(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    const network =
      extensionAction.parameters.network ||
      request.extensions[this.paymentNetworkId]?.values.network;

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

    if (!supportedCurrencies[network][request.currency.type].includes(request.currency.value)) {
      throw new Error(
        `The currency (${request.currency.value}) of the request is not supported for this payment network.`,
      );
    }
  }
}

const conversionErc20FeeProxyContract: ExtensionTypes.PnAnyToErc20.IAnyToERC20 = new anyToErc20ProxyPaymentNetwork() as ExtensionTypes.PnAnyToErc20.IAnyToERC20;

export default conversionErc20FeeProxyContract;
