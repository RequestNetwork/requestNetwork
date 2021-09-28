import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

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
    const network = this.getNetworkOfPayment(requestCurrency, paymentNetwork);

    const proxyContractArtifact = await this.safeGetProxyArtifact(network, paymentNetwork.version);

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

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getNetworkOfPayment(
    requestCurrency: RequestLogicTypes.ICurrency,
    // eslint-disable-next-line
    _paymentNetwork: ExtensionTypes.IState<any>,
  ): string {
    const network = requestCurrency.network;
    if (!network) {
      throw Error('requestCurrency.network must be defined');
    }
    return network;
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
