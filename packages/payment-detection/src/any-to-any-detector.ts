import { ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector';

import { ICurrencyManager } from '@requestnetwork/currency';

/**
 * Abstract class to extend to get the payment balance of conversion requests
 */
export abstract class AnyToAnyDetector<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters
> extends FeeReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension, with conversion
   * @param extensionType Example : PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY
   */
  public constructor(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    protected currencyManager: ICurrencyManager,
  ) {
    super(paymentNetworkId, extension);
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
}
