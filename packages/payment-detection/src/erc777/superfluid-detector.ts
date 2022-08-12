import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import { PaymentReferenceCalculator } from '..';

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
    return !!request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM].values
      .masterRequestId;
  }

  /**
   * This returns the specific values we store for the ERC777 extensions.
   * The extra fields specific for this extension are:
   * expectedStartDate: The expected start date of streaming
   * expectedFlowRate: extensionAction.parameters.expectedFlowRate,
   * previousRequestId: The previous requestId in the streaming series
   * masterRequestId: The first requestId of the streaming series
   * recurrenceNumber: The position of this request in the streaming series, 0 indexed.
   * @param request The request we are processing
   * @returns Object
   */
  protected getSubsequentValues(request: RequestLogicTypes.IRequest): Record<string, any> {
    return request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM].values;
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
    if (this.isSubsequentRequest(request)) {
      if (totalBalance.balance) {
        const subrequestValues = this.getSubsequentValues(request);
        const expectedPreviousBalance =
          subrequestValues.recurrenceNumber * subrequestValues.expectedAmount;
        const remainingBalance = parseFloat(totalBalance.balance) - expectedPreviousBalance;
        const subsequentRequestBalance = remainingBalance > 0 ? remainingBalance.toString() : '0';
        totalBalance.balance = subsequentRequestBalance;
      }
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
