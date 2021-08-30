import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError, MissingPaymentNetworkError } from './address-based';

import ReferenceBasedPaymentNetwork from './reference-based';

/**
 * Implementation of the payment network to pay in ETH based on input data.
 */
export default abstract class NativeTokenPaymentNetwork extends ReferenceBasedPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID,
    currentVersion: string,
    supportedNetworks: string[],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }

  public createCreationAction(
    creationParameters: ExtensionTypes.PnReferenceBased.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnReferenceBased.ICreationParameters> {
    const networkName = creationParameters.paymentNetworkName;
    if (!networkName) {
      throw new MissingPaymentNetworkError(this.extensionId);
    }
    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress, networkName)
    ) {
      throw new InvalidPaymentAddressError();
    }
    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress, networkName)
    ) {
      throw new InvalidPaymentAddressError('refundAddress');
    }
    return super.createCreationAction(creationParameters);
  }

  public createAddPaymentAddressAction(
    addPaymentAddressParameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    if (!addPaymentAddressParameters.paymentNetworkName) {
      throw new MissingPaymentNetworkError(this.extensionId);
    }
    if (
      !this.isValidAddress(
        addPaymentAddressParameters.paymentAddress,
        addPaymentAddressParameters.paymentNetworkName,
      )
    ) {
      throw new InvalidPaymentAddressError();
    }
    return super.createAddPaymentAddressAction(addPaymentAddressParameters);
  }

  public createAddRefundAddressAction(
    addRefundAddressParameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    if (!addRefundAddressParameters.paymentNetworkName) {
      throw new MissingPaymentNetworkError(this.extensionId);
    }
    if (
      !this.isValidAddress(
        addRefundAddressParameters.refundAddress,
        addRefundAddressParameters.paymentNetworkName,
      )
    ) {
      throw new InvalidPaymentAddressError('refundAddress');
    }
    return super.createAddRefundAddressAction(addRefundAddressParameters);
  }
}
