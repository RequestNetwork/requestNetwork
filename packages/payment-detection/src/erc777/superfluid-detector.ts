import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import { BigNumber } from 'ethers';
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
      .originalRequestId;
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
      const zeroBN = BigNumber.from(0);
      let expectedPreviousBalance = zeroBN;
      if (this.isSubsequentRequest(request)) {
        const subrequestValues = this.getSubsequentValues(request);
        expectedPreviousBalance =
          BigNumber.from(subrequestValues.recurrenceNumber).mul(request.expectedAmount);
      }
      const remainingBalance = BigNumber.from(totalBalance.balance).sub(expectedPreviousBalance);
      let requestBalance = zeroBN;
      const expectedAmount = BigNumber.from(request.expectedAmount);
      if (remainingBalance.gte(expectedAmount)) {
        requestBalance = expectedAmount;
      } else {
        requestBalance = remainingBalance.gt(zeroBN) ? remainingBalance : zeroBN;
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
      const originalRequestId =
        request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM].values.originalRequestId;
      return PaymentReferenceCalculator.calculate(originalRequestId, salt, paymentAddress);
    }
    return PaymentReferenceCalculator.calculate(request.requestId, salt, paymentAddress);
  }
}
