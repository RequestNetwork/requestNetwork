import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { EthProxyInfoRetriever } from './proxy-info-retriever';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { TheGraphInfoRetriever } from '../thegraph';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment networks with ETH fee proxy extension
 */
export class EthFeeProxyPaymentDetector extends FeeReferenceBasedDetector<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IETHFeePaymentEventParameters
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
      ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      advancedLogic.extensions.feeProxyContractEth,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param eventName Indicate if it is an address for payment or refund
   * @param toAddress Address to check
   * @param paymentReference The reference to identify the payment
   * @param _requestCurrency The request currency
   * @param paymentChain the name of the payment (block)chain
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased extends ExtensionTypes.IExtension<
      infer X
    >
      ? ExtensionTypes.IState<X>
      : never,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IETHPaymentEventParameters>> {
    if (!toAddress) {
      return {
        paymentEvents: [],
      };
    }

    const proxyContractArtifact = EthFeeProxyPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );
    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const graphInfoRetriever = new TheGraphInfoRetriever(subgraphClient, this.currencyManager);

      return graphInfoRetriever.getTransferEvents({
        paymentReference,
        contractAddress: proxyContractArtifact.address,
        toAddress,
        eventName,
        paymentChain,
      });
    } else {
      const proxyInfoRetriever = new EthProxyInfoRetriever(
        paymentReference,
        proxyContractArtifact.address,
        proxyContractArtifact.creationBlockNumber,
        toAddress,
        eventName,
        paymentChain,
      );
      const paymentEvents = await proxyInfoRetriever.getTransferEvents();
      return {
        paymentEvents,
      };
    }
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethereumFeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
