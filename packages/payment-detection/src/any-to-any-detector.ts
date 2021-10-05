import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import FeeReferenceBasedDetector from './fee-reference-based-detector';

import { ICurrencyManager } from '@requestnetwork/currency';

/**
 * Abstract class to extend to get the payment balance of conversion requests
 */
export default abstract class AnyToAnyDetector<
  TPaymentEventParameters
> extends FeeReferenceBasedDetector<TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension, with conversion
   * @param extensionType Example : ExtensionTypes.ID.ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY
   */
  public constructor(
    public extension: ExtensionTypes.PnAnyToAnyConversion.IConversionReferenceBased,
    protected extensionType: ExtensionTypes.ID,
    protected currencyManager: ICurrencyManager,
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

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected abstract getPaymentChain(
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): string;
}
