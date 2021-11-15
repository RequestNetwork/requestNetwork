import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError } from './address-based';

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
    if (!networkName && (creationParameters.paymentAddress || creationParameters.refundAddress)) {
      throw new Error(
        `The network name is mandatory for the creation of the extension ${this.extensionId}.`,
      );
    }
    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress, networkName)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.paymentAddress);
    }
    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress, networkName)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.refundAddress, 'refundAddress');
    }
    return super.createCreationAction(creationParameters);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isValidAddress(_address: string, _networkName?: string): boolean {
    throw new Error(
      `Default implementation of isValidAddress() does not support native tokens. Please override this method.`,
    );
  }
}
