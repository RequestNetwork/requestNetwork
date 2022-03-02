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
import { networkSupportsTheGraph } from '../thegraph';

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
export class EthFeeProxyPaymentDetector extends FeeReferenceBasedDetector<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IETHFeePaymentEventParameters
> {
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
   * @param eventName Indicate if it is an address for payment or refund
   * @param address Address to check
   * @param paymentReference The reference to identify the payment
   * @param _requestCurrency The request currency
   * @param paymentChain the name of the payment (block)chain
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased extends ExtensionTypes.IExtension<
      infer X
    >
      ? ExtensionTypes.IState<X>
      : never,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    if (!address) {
      return [];
    }

    const proxyContractArtifact = EthFeeProxyPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    const proxyInfoRetriever = networkSupportsTheGraph(paymentChain)
      ? new TheGraphInfoRetriever(
          paymentReference,
          proxyContractArtifact.address,
          null,
          address,
          eventName,
          paymentChain,
        )
      : new EthProxyInfoRetriever(
          paymentReference,
          proxyContractArtifact.address,
          proxyContractArtifact.creationBlockNumber,
          address,
          eventName,
          paymentChain,
        );

    return proxyInfoRetriever.getTransferEvents();
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethereumFeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
