import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { ReferenceBasedDetector } from '../reference-based-detector';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import { BigNumber } from 'ethers';
import { ReferenceBasedDetectorOptions } from '../types';
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
  public constructor({ advancedLogic, currencyManager }: ReferenceBasedDetectorOptions) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM,
      advancedLogic.extensions.erc777Stream,
      currencyManager,
    );
  }

  protected isSubsequentRequest(request: RequestLogicTypes.IRequest): boolean {
    return !!request.extensions[this.paymentNetworkId].values.originalRequestId;
  }

  /**
   * This returns the specific values we store for the ERC777 extensions.
   * @param request The request we are processing
   */
  protected getSubsequentValues(
    request: RequestLogicTypes.IRequest,
  ): ExtensionTypes.PnStreamReferenceBased.ISubsequentRequestCreationParameters {
    return request.extensions[this.paymentNetworkId].values;
  }

  /**
   * With streaming requests we have a custom balance computation.
   * It is possible to have only one streaming event, start stream,
   * but have 10 requests being created each month for the same stream.
   * For the original request, the first one, the balance computation is easy because we don't care about previous expected balance.
   * For subsequent requests we must take into consideration how many requests were before this one and then attribute the rest of the balance to this one.
   * At this point we are not detecting overpayment because in case of overpayment we are considering that another request should have been created in the series.
   * @param request The request we are calculating balance for
   * @returns Balance object with balance value and payment/refund events
   */
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
      const recurrenceNumber = this.getSubsequentValues(request).recurrenceNumber || 0;
      // This request's balance is the total streamed amount, less all previous requests balance.
      const remainingBalance = BigNumber.from(totalBalance.balance).sub(
        BigNumber.from(request.expectedAmount).mul(BigNumber.from(recurrenceNumber)),
      );
      // Balance is stricty between 0 and expectedAmount
      const expectedAmount = BigNumber.from(request.expectedAmount);
      const requestBalance = remainingBalance.lt(0)
        ? zeroBN
        : remainingBalance.gt(expectedAmount)
        ? expectedAmount
        : remainingBalance;
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
    paymentChain: CurrencyTypes.EvmChainName,
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

  /**
   * In the case of the first, original request that starts the streaming,
   * we calculate the payment reference from its own data: requestId, salt, paymentAddress.
   * In the case of subsequent requests we need to have the same payment reference from the original request,
   * so we need to use the original requests requestId, which we have stored in
   * extension values as originalRequestId, the salt and paymentAddress are the same.
   * @param request The request we need payment reference for
   * @returns The payment reference
   */
  protected async getPaymentReference(request: RequestLogicTypes.IRequest): Promise<string> {
    const { paymentAddress, salt } = this.getPaymentExtension(request).values;
    this.checkRequiredParameter(paymentAddress, 'paymentAddress');
    this.checkRequiredParameter(salt, 'salt');
    const requestId = this.isSubsequentRequest(request)
      ? this.getSubsequentValues(request).originalRequestId
      : request.requestId;
    return PaymentReferenceCalculator.calculate(requestId, salt, paymentAddress);
  }
}
