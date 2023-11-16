import { CurrencyTypes, ExtensionTypes } from '@requestnetwork/types';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector';
import { generate8randomBytes } from '@requestnetwork/utils';

/**
 * Abstract class to extend to get the payment balance of conversion requests
 */
export abstract class AnyToAnyDetector<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends Partial<ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters>,
> extends FeeReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension, with conversion
   */
  protected constructor(
    paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    currencyManager: CurrencyTypes.ICurrencyManager,
  ) {
    super(paymentNetworkId, extension, currencyManager);
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
      paymentNetworkCreationParameters.salt || (await generate8randomBytes());

    return this.extension.createCreationAction(paymentNetworkCreationParameters);
  }
}
