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
import { getDeploymentInformation } from '../utils';

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
export class EthInputDataPaymentDetector extends ReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
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
      advancedLogic,
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
    const network = this.getPaymentChain(requestCurrency, paymentNetwork);

    const infoRetriever = new EthInputDataInfoRetriever(
      address,
      eventName,
      network,
      paymentReference,
      this.explorerApiKeys[network],
    );
    const events = await infoRetriever.getTransferEvents();
    const proxyContractArtifact = EthInputDataPaymentDetector.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    if (proxyContractArtifact) {
      const proxyInfoRetriever = new EthProxyInfoRetriever(
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
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = getDeploymentInformation(
    SmartContracts.ethereumProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
