import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import PaymentReferenceCalculator from '../payment-reference-calculator';
/**
 * Handle payment networks with ERC777 Superfluid streaming extension
 */
export class SuperFluidPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IERC777PaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM, advancedLogic.extensions.erc777Stream);
  }

  protected isSubsequentRequest(request: RequestLogicTypes.IRequest): boolean {
    return !!request.extensions[this.paymentNetworkId].values
      .masterRequestId;
  }

  /**
   * This returns the specific values we store for the ERC777 extensions.
   * @param request The request we are processing
   */
  protected getSubsequentValues(request: RequestLogicTypes.IRequest): ExtensionTypes.PnStreamReferenceBased.ISubsequentRequestCreationParameters {
    return request.extensions[this.paymentNetworkId].values;
  }

  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IBalanceWithEvents<
      PaymentTypes.IERC777PaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >
  > {
    const totalBalance = await super.getBalance(request);
    if (totalBalance.error) {
      return totalBalance;
    }
    if (totalBalance.balance) {
      let expectedPreviousBalance = 0;
      if (this.isSubsequentRequest(request)) {
        const subrequestValues = this.getSubsequentValues(request);
        expectedPreviousBalance =
          subrequestValues.recurrenceNumber * parseFloat(request.expectedAmount.toString());
      }
      const remainingBalance = parseFloat(totalBalance.balance) - expectedPreviousBalance;
      let requestBalance = 0;
      if (remainingBalance > request.expectedAmount) {
        requestBalance = parseFloat(request.expectedAmount.toString());
      } else {
        requestBalance = remainingBalance > 0 ? remainingBalance : 0;
      }
      totalBalance.balance = requestBalance.toString();
    }
    return totalBalance;
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param eventName Indicate if it is an address for payment or refund
   * @param address Address to check
   * @param paymentReference The reference to identify the payment
   * @param requestCurrency The request currency
   * @param paymentChain the payment network
   * @returns List of payment events
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC777PaymentEventParameters>> {
    if (!address) {
      return {
        paymentEvents: [],
      };
    }

    const infoRetriever = new SuperFluidInfoRetriever(
      paymentReference,
      requestCurrency.value,
      address,
      eventName,
      paymentChain,
    );
    const paymentEvents = await infoRetriever.getTransferEvents();
    return {
      paymentEvents,
    };
  }

  protected getPaymentReference(request: RequestLogicTypes.IRequest): string {
    const { paymentAddress, salt } = this.getPaymentExtension(request).values;
    this.checkRequiredParameter(paymentAddress, 'paymentAddress');
    this.checkRequiredParameter(salt, 'salt');
    if (this.isSubsequentRequest(request)) {
      const masterRequestId =
        request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM].values.masterRequestId;
      return PaymentReferenceCalculator.calculate(masterRequestId, salt, paymentAddress);
    }
    return PaymentReferenceCalculator.calculate(request.requestId, salt, paymentAddress);
  }
}
