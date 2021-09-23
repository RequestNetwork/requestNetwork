import * as SmartContracts from '@requestnetwork/smart-contracts';
import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import ProxyEthereumInfoRetriever from './proxy-info-retriever';
import FeeReferenceBasedDetector from '../fee-reference-based-detector';

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
export default class ETHFeeProxyDetector extends FeeReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      advancedLogic.extensions.feeProxyContractEth,
      ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
    );
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param paymentNetworkVersion the version of the payment network
   * @returns The balance
   */
  protected async extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    paymentReference: string,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const proxyContractArtifact = await this.safeGetProxyArtifact(network, paymentNetworkVersion);

    if (!proxyContractArtifact) {
      throw Error('ETH fee proxy contract not found');
    }

    const proxyInfoRetriever = new ProxyEthereumInfoRetriever(
      paymentReference,
      proxyContractArtifact.address,
      proxyContractArtifact.creationBlockNumber,
      address,
      eventName,
      network,
    );

    return await proxyInfoRetriever.getTransferEvents();
  }

  /*
   * Fetches events from the Ethereum Proxy, or returns null
   */
  private async safeGetProxyArtifact(network: string, paymentNetworkVersion: string) {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    try {
      return SmartContracts.ethereumFeeProxyArtifact.getDeploymentInformation(
        network,
        contractVersion,
      );
    } catch (error) {
      console.warn(error);
    }
    return null;
  }
}
