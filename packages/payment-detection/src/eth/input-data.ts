import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { EthInputDataInfoRetriever } from './info-retriever';
import { EthProxyInfoRetriever } from './proxy-info-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { networkSupportsTheGraphForNativePayments } from '../thegraph';
import { TheGraphInfoRetriever } from '../erc20/thegraph-info-retriever';

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
export class EthInputDataPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IETHPaymentEventParameters
> {
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
      PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
      advancedLogic.extensions.ethereumInputData,
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
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnReferenceBased.ICreationParameters>,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    if (!address) {
      return [];
    }
    const infoRetriever = new EthInputDataInfoRetriever(
      address,
      eventName,
      paymentChain,
      paymentReference,
      this.explorerApiKeys[paymentChain],
    );
    const events = await infoRetriever.getTransferEvents();
    const proxyContractArtifact = EthInputDataPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    if (proxyContractArtifact) {
      const proxyInfoRetriever = networkSupportsTheGraphForNativePayments(paymentChain)
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

      const proxyEvents = await proxyInfoRetriever.getTransferEvents();
      events.push(...proxyEvents);
    }
    return events;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethereumProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
