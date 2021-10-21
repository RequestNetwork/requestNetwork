import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
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
    protected advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    protected extension: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
    protected extensionType: ExtensionTypes.ID,
    protected currencyManager: ICurrencyManager,
  ) {
    super(advancedLogic, extension, extensionType);
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    paymentNetworkCreationParameters.salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      network: paymentNetworkCreationParameters.network,
      maxRateTimespan: paymentNetworkCreationParameters.maxRateTimespan,
      ...paymentNetworkCreationParameters,
    });
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
