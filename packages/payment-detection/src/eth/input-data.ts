import * as SmartContracts from '@requestnetwork/smart-contracts';
import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { EthInputDataInfoRetriever } from './info-retriever';
import { EthProxyInfoRetriever } from './proxy-info-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { TheGraphInfoRetriever } from '../thegraph';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.1.0',
  ['0.3.0']: '0.3.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export class EthInputDataPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IETHPaymentEventParameters
> {
  private explorerApiKeys: Record<string, string>;
  private readonly getSubgraphClient: PaymentNetworkOptions['getSubgraphClient'];

  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    currencyManager,
    explorerApiKeys,
    getSubgraphClient,
  }: ReferenceBasedDetectorOptions &
    Pick<PaymentNetworkOptions, 'explorerApiKeys' | 'getSubgraphClient'>) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
      advancedLogic.extensions.ethereumInputData,
      currencyManager,
    );
    this.explorerApiKeys = explorerApiKeys || {};
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnReferenceBased.ICreationParameters>,
  ): Promise<
    PaymentTypes.AllNetworkEvents<
      PaymentTypes.IETHPaymentEventParameters | PaymentTypes.IETHFeePaymentEventParameters
    >
  > {
    if (!toAddress) {
      return {
        paymentEvents: [],
      };
    }
    const infoRetriever = new EthInputDataInfoRetriever(
      toAddress,
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
    let allEvents: PaymentTypes.AllNetworkEvents<
      PaymentTypes.IETHPaymentEventParameters | PaymentTypes.IETHFeePaymentEventParameters
    >;
    let escrowEvents: PaymentTypes.EscrowNetworkEvent[] | undefined = [];
    if (proxyContractArtifact) {
      const subgraphClient = this.getSubgraphClient(paymentChain);
      if (subgraphClient) {
        const graphInfoRetriever = new TheGraphInfoRetriever(subgraphClient, this.currencyManager);
        allEvents = await graphInfoRetriever.getTransferEvents({
          paymentReference,
          contractAddress: proxyContractArtifact.address,
          toAddress,
          eventName,
          paymentChain,
        });
      } else {
        const ethInfoRetriever = new EthProxyInfoRetriever(
          paymentReference,
          proxyContractArtifact.address,
          proxyContractArtifact.creationBlockNumber,
          toAddress,
          eventName,
          paymentChain,
        );
        const paymentEvents = await ethInfoRetriever.getTransferEvents();
        allEvents = {
          paymentEvents,
        };
      }
      events.push(...allEvents.paymentEvents);
      escrowEvents = allEvents.escrowEvents;
    }
    return {
      paymentEvents: events,
      escrowEvents: escrowEvents,
    };
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethereumProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
    true,
  );
}
