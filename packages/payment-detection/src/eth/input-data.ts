import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import EthInputDataInfoRetriever from './info-retriever';
import EthProxyInputDataInfoRetriever from './proxy-info-retriever';
import ReferenceBasedDetector from '../reference-based-detector';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.1.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export default class PaymentNetworkETHInputData extends ReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  private explorerApiKeys: Record<string, string>;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    explorerApiKeys,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    explorerApiKeys?: Record<string, string>;
  }) {
    super(
      advancedLogic.extensions.ethereumInputData,
      ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    );
    this.explorerApiKeys = explorerApiKeys || {};
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
    const infoRetriever = new EthInputDataInfoRetriever(
      address,
      eventName,
      network,
      paymentReference,
      this.explorerApiKeys[network],
    );
    const events = await infoRetriever.getTransferEvents();
    const proxyContractArtifact = await this.safeGetProxyArtifact(network, paymentNetwork.version);

    if (proxyContractArtifact) {
      const proxyInfoRetriever = new EthProxyInputDataInfoRetriever(
        paymentReference,
        proxyContractArtifact.address,
        proxyContractArtifact.creationBlockNumber,
        address,
        eventName,
        network,
      );
      const proxyEvents = await proxyInfoRetriever.getTransferEvents();
      for (const event of proxyEvents) {
        events.push(event);
      }
    }
    return events;
  }

  /*
   * Fetches events from the Ethereum Proxy, or returns null
   */
  private async safeGetProxyArtifact(network: string, paymentNetworkVersion: string) {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    try {
      return SmartContracts.ethereumProxyArtifact.getDeploymentInformation(
        network,
        contractVersion,
      );
    } catch (error) {
      console.warn(error);
    }
    return null;
  }
}
