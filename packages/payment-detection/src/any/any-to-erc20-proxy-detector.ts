import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { ICurrencyManager } from '@requestnetwork/currency';

import ProxyInfoRetriever from './any-to-erc20-proxy-info-retriever';
import AnyToAnyDetector from '../any-to-any-detector';
import { networkSupportsTheGraph } from '../thegraph';
import TheGraphAnyToErc20Retriever from './thegraph-info-retriever';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ANY TO ERC20 conversion proxy
 */
export default class AnyToErc20FeeProxyDetector extends AnyToAnyDetector<PaymentTypes.IConversionPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
  }) {
    super(
      advancedLogic.extensions.anyToErc20Proxy as ExtensionTypes.PnAnyToErc20.IAnyToERC20,
      ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
      currencyManager,
    );
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IConversionPaymentEventParameters>[]> {
    const network = this.getPaymentChain(requestCurrency, paymentNetwork);

    const conversionProxyContract = await this.safeGetProxyArtifact(
      network,
      paymentNetwork.version,
    );

    if (!conversionProxyContract) {
      throw Error('ERC20 conversion proxy contract not found');
    }

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw Error('requestCurrency not found in currency manager');
    }

    const proxyInfoRetriever = networkSupportsTheGraph(network)
      ? new TheGraphAnyToErc20Retriever(
          currency,
          paymentReference,
          conversionProxyContract.address,
          address,
          eventName,
          network,
          paymentNetwork.values?.acceptedTokens,
          paymentNetwork.values?.maxRateTimespan,
        )
      : new ProxyInfoRetriever(
          currency,
          paymentReference,
          conversionProxyContract.address,
          conversionProxyContract.creationBlockNumber,
          conversionProxyContract.abi,
          address,
          eventName,
          network,
          paymentNetwork.values?.acceptedTokens,
          paymentNetwork.values?.maxRateTimespan,
        );

    return await proxyInfoRetriever.getTransferEvents();
  }

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getPaymentChain(
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): string {
    const network = paymentNetwork.values.network;
    if (!network) {
      throw Error('paymentNetwork.values.network must be defined');
    }
    return network;
  }

  /*
   * Fetches events from the Ethereum Proxy, or returns null
   */
  private async safeGetProxyArtifact(network: string, paymentNetworkVersion: string) {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    try {
      const abi = SmartContracts.erc20ConversionProxy.getContractAbi(contractVersion);
      const contractInfos = SmartContracts.erc20ConversionProxy.getDeploymentInformation(
        network,
        contractVersion,
      );
      return { ...contractInfos, ...{ abi } };
    } catch (error) {
      console.warn(error);
    }
    return null;
  }
}
