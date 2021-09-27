import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { ICurrencyManager } from '@requestnetwork/currency';

import ProxyInfoRetriever from './any-to-eth-proxy-info-retriever';
import AnyToAnyDetector from '../any-to-any-detector';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export default class ETHFeeProxyDetector extends AnyToAnyDetector<PaymentTypes.IETHPaymentEventParameters> {
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
      advancedLogic.extensions.feeProxyContractEth,
      ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
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
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const network = requestCurrency.network;
    if (!network) {
      throw Error('requestCurrency.network must be defined');
    }

    const { ethFeeProxyContract, conversionProxyContract } = await this.safeGetProxiesArtifacts(
      network,
      paymentNetwork.version,
    );

    if (!ethFeeProxyContract) {
      throw Error('ETH fee proxy contract not found');
    }
    if (!conversionProxyContract) {
      throw Error('ETH conversion proxy contract not found');
    }

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw Error('requestCurrency not found in currency manager');
    }

    const proxyInfoRetriever = new ProxyInfoRetriever(
      currency,
      paymentReference,
      conversionProxyContract.address,
      conversionProxyContract.creationBlockNumber,
      ethFeeProxyContract.address,
      ethFeeProxyContract.creationBlockNumber,
      address,
      eventName,
      network,
      paymentNetwork.values?.maxRateTimespan,
    );

    return await proxyInfoRetriever.getTransferEvents();
  }

  /*
   * Fetches events from the Ethereum Proxy, or returns null
   */
  private async safeGetProxiesArtifacts(network: string, paymentNetworkVersion: string) {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    let ethFeeProxyContract = null;
    let conversionProxyContract = null;

    try {
      ethFeeProxyContract = SmartContracts.ethConversionArtifact.getDeploymentInformation(
        network,
        contractVersion,
      );
    } catch (error) {
      console.warn(error);
    }

    try {
      conversionProxyContract = SmartContracts.ethereumFeeProxyArtifact.getDeploymentInformation(
        network,
        contractVersion,
      );
    } catch (error) {
      console.warn(error);
    }

    return { ethFeeProxyContract, conversionProxyContract };
  }
}
