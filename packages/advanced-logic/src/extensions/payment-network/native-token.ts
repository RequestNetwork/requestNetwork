import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError, UnsupportedNetworkError } from './address-based';

import ReferenceBasedPaymentNetwork from './reference-based';
import { ICurrencyManager } from '@requestnetwork/currency';

/**
 * Implementation of the payment network to pay in ETH based on input data.
 */
export default abstract class NativeTokenPaymentNetwork extends ReferenceBasedPaymentNetwork {
  public constructor(
    currencyManager: ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
    currentVersion: string,
    public readonly supportedNetworks: CurrencyTypes.ChainName[],
  ) {
    super(currencyManager, extensionId, currentVersion, RequestLogicTypes.CURRENCY.ETH);
  }

  public createCreationAction(
    creationParameters: ExtensionTypes.PnReferenceBased.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnReferenceBased.ICreationParameters> {
    const networkName = creationParameters.paymentNetworkName;
    if (creationParameters.paymentAddress || creationParameters.refundAddress) {
      if (networkName) {
        this.throwIfInvalidNetwork(networkName);
      } else {
        throw new Error(
          `The network name is mandatory for the creation of the extension ${this.extensionId}.`,
        );
      }
    }
    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.paymentAddress);
    }
    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.refundAddress, 'refundAddress');
    }
    return super.createCreationAction(creationParameters);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isValidAddress(_address: string): boolean {
    throw new Error(
      `Default implementation of isValidAddress() does not support native tokens. Please override this method.`,
    );
  }

  protected throwIfInvalidNetwork(
    network?: CurrencyTypes.ChainName,
  ): asserts network is CurrencyTypes.ChainName {
    super.throwIfInvalidNetwork(network);
    if (this.supportedNetworks && !this.supportedNetworks.includes(network)) {
      throw new UnsupportedNetworkError(network, this.supportedNetworks);
    }
  }
}
