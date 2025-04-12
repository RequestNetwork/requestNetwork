import { FeeReferenceBasedPaymentNetwork } from './fee-reference-based';
import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError, UnsupportedNetworkError } from './address-based';

export default abstract class AnyToNativeTokenPaymentNetwork extends FeeReferenceBasedPaymentNetwork<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> {
  protected constructor(
    currencyManager: CurrencyTypes.ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
    currentVersion: string,
    public readonly supportedNetworks: CurrencyTypes.ChainName[],
  ) {
    super(currencyManager, extensionId, currentVersion, RequestLogicTypes.CURRENCY.ETH);
  }

  public createCreationAction(
    creationParameters: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> {
    const network = creationParameters.network;
    this.throwIfInvalidNetwork(network);
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
    if (creationParameters.feeAddress && !this.isValidAddress(creationParameters.feeAddress)) {
      throw new InvalidPaymentAddressError(creationParameters.feeAddress, 'feeAddress');
    }
    if (creationParameters.maxRateTimespan && creationParameters.maxRateTimespan < 0) {
      throw new InvalidMaxRateTimespanError(creationParameters.maxRateTimespan);
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

export class InvalidMaxRateTimespanError extends Error {
  constructor(maxRateTimespan: number) {
    super(`${maxRateTimespan} is not a valid maxRateTimespan`);
  }
}
