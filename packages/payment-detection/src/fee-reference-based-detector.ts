import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedDetector from './reference-based-detector';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export default abstract class FeeReferenceBasedDetector<
  TPaymentEventParameters
> extends ReferenceBasedDetector<TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension, reference based
   * @param extensionType Example : ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA
   */
  public constructor(
    public extension: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
    protected extensionType: ExtensionTypes.ID,
  ) {
    super(extension, extensionType);
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
  protected abstract extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[]>;
}
