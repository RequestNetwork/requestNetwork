import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';

/**
 * Handle payment networks with ERC777 Superfluid streaming extension
 */
export class SuperFluidPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IERC20PaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      advancedLogic.extensions.proxyContractErc20,
    );
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
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20PaymentEventParameters>[]> {
    if (!address) {
      return [];
    }

    const infoRetriever = new SuperFluidInfoRetriever(
      paymentReference,
      requestCurrency.value,
      address,
      eventName,
      paymentChain,
    );

    return infoRetriever.getTransferEvents();
  }
}
