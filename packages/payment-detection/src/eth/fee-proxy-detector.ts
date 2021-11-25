import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { EthProxyInfoRetriever } from './proxy-info-retriever';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import TheGraphInfoRetriever from '../erc20/thegraph-info-retriever';
import { makeGetDeploymentInformation } from '../utils';
import { networkSupportsTheGraphForNativePayments } from '../thegraph';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ETH fee proxy extension
 */
export class EthFeeProxyPaymentDetector extends FeeReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      advancedLogic.extensions.feeProxyContractEth,
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
    const network = this.getPaymentChain(requestCurrency, paymentNetwork);

    const proxyContractArtifact = EthFeeProxyPaymentDetector.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    if (!proxyContractArtifact) {
      throw Error('ETH fee proxy contract not found');
    }

    const proxyInfoRetriever = networkSupportsTheGraphForNativePayments(network)
      ? new TheGraphInfoRetriever(
          paymentReference,
          proxyContractArtifact.address,
          null,
          address,
          eventName,
          network,
        )
      : new EthProxyInfoRetriever(
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
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethereumFeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
