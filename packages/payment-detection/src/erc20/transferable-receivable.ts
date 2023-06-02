import {
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
  CurrencyTypes,
} from '@requestnetwork/types';

import { TheGraphInfoRetriever } from '../thegraph';
import { erc20TransferableReceivableArtifact } from '@requestnetwork/smart-contracts';
import { makeGetDeploymentInformation } from '../utils';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions, TGetSubGraphClient } from '../types';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import ProxyERC20InfoRetriever from './proxy-info-retriever';

const ERC20_TRANSFERABLE_RECEIVABLE_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment networks with ERC20 transferable receivable contract extension
 */
export class ERC20TransferableReceivablePaymentDetector extends FeeReferenceBasedDetector<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IERC20PaymentEventParameters
> {
  private readonly getSubgraphClient: TGetSubGraphClient<CurrencyTypes.EvmChainName>;

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
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE,
      advancedLogic.extensions.erc20TransferableReceivable,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance and events
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnReferenceBased.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20PaymentEventParameters>> {
    // To satisfy typescript
    toAddress;
    if (!paymentReference) {
      return {
        paymentEvents: [],
      };
    }

    const {
      address: receivableContractAddress,
      creationBlockNumber: receivableCreationBlockNumber,
    } = ERC20TransferableReceivablePaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const graphInfoRetriever = new TheGraphInfoRetriever(subgraphClient, this.currencyManager);
      return graphInfoRetriever.getReceivableEvents({
        paymentReference,
        toAddress: '', // Filtering by payee address does not apply for transferable receivables
        contractAddress: receivableContractAddress,
        paymentChain,
        eventName,
        acceptedTokens: [requestCurrency.value],
      });
    } else {
      const transferableReceivableInfoRetriever = new ProxyERC20InfoRetriever(
        paymentReference,
        receivableContractAddress,
        receivableCreationBlockNumber,
        requestCurrency.value,
        '',
        eventName,
        paymentChain,
      );
      const paymentEvents = await transferableReceivableInfoRetriever.getTransferEvents(
        true /* isReceivable */,
      );
      return {
        paymentEvents,
      };
    }
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20TransferableReceivableArtifact,
    ERC20_TRANSFERABLE_RECEIVABLE_CONTRACT_ADDRESS_MAP,
  );
}
