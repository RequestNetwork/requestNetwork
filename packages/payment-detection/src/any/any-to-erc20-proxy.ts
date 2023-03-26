import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ERC20FeeProxyPaymentDetectorBase } from '../erc20/fee-proxy-contract';
import { AnyToErc20InfoRetriever } from './retrievers/any-to-erc20-proxy';
import { TheGraphConversionInfoRetriever } from '../thegraph/conversion-info-retriever';
import { makeGetDeploymentInformation } from '../utils';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';
import { generate8randomBytes } from '@requestnetwork/utils';
import { EvmChains } from '@requestnetwork/currency';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with conversion proxy contract extension
 */
export class AnyToERC20PaymentDetector extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnAnyToErc20.IAnyToERC20,
  PaymentTypes.IERC20FeePaymentEventParameters
> {
  private readonly getSubgraphClient: PaymentNetworkOptions<CurrencyTypes.EvmChainName>['getSubgraphClient'];

  /**
   * @param extension The advanced logic payment network extensions
   */

  public constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
  }: ReferenceBasedDetectorOptions &
    Pick<PaymentNetworkOptions<CurrencyTypes.EvmChainName>, 'getSubgraphClient'>) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      advancedLogic.extensions.anyToErc20Proxy,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: PaymentTypes.IAnyToErc20CreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt = paymentNetworkCreationParameters.salt || (await generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      network: paymentNetworkCreationParameters.network,
      acceptedTokens: paymentNetworkCreationParameters.acceptedTokens,
      maxRateTimespan: paymentNetworkCreationParameters.maxRateTimespan,
      salt,
    });
  }

  /**
   * Extracts the balance and events of a request
   *
   * @private
   * @param request Address to check
   * @param salt Payment reference salt
   * @param toAddress Payee address
   * @param eventName Indicate if it is an address for payment or refund
   * @param paymentNetwork Payment network state
   * @returns The balance and events
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnAnyToErc20.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (!toAddress) {
      return {
        paymentEvents: [],
      };
    }
    const { acceptedTokens, maxRateTimespan = 0 } = paymentNetwork.values;

    const {
      address: conversionProxyContractAddress,
      creationBlockNumber: conversionProxyCreationBlockNumber,
    } = AnyToERC20PaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);

    const conversionProxyAbi = erc20ConversionProxy.getContractAbi(paymentNetwork.version);

    const currency = await this.getCurrency(requestCurrency);

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const infoRetriever = new TheGraphConversionInfoRetriever(
        subgraphClient,
        this.currencyManager,
      );
      return await infoRetriever.getTransferEvents({
        paymentReference,
        contractAddress: conversionProxyContractAddress,
        toAddress,
        eventName,
        paymentChain,
        acceptedTokens,
        maxRateTimespan,
        requestCurrency: currency,
      });
    }

    const infoRetriever = new AnyToErc20InfoRetriever(
      currency,
      paymentReference,
      conversionProxyContractAddress,
      conversionProxyCreationBlockNumber,
      conversionProxyAbi,
      toAddress,
      eventName,
      paymentChain,
      acceptedTokens,
      maxRateTimespan,
    );
    const paymentEvents =
      (await infoRetriever.getTransferEvents()) as PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters>[];
    return {
      paymentEvents,
    };
  }

  protected getPaymentChain(request: RequestLogicTypes.IRequest): CurrencyTypes.EvmChainName {
    const network = this.getPaymentExtension(request).values.network;
    if (!network) {
      throw Error(`request.extensions[${this.paymentNetworkId}].values.network must be defined`);
    }
    EvmChains.assertChainSupported(network);
    return network;
  }

  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20ConversionProxy,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
