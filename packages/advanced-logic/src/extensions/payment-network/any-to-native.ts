import { FeeReferenceBasedPaymentNetwork } from './fee-reference-based';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError } from './address-based';

export default abstract class AnyToNativeTokenPaymentNetwork extends FeeReferenceBasedPaymentNetwork {
  protected constructor(
    public readonly extensionId: ExtensionTypes.ID,
    public readonly currentVersion: string,
    public readonly supportedNetworks: string[],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }

  public createCreationAction(
    creationParameters: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> {
    const network = creationParameters.network;
    this.throwIfInvalidNetwork(network);

    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress, network)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.paymentAddress);
    }
    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress, network)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.refundAddress, 'refundAddress');
    }
    if (
      creationParameters.feeAddress &&
      !this.isValidAddress(creationParameters.feeAddress, network)
    ) {
      throw new InvalidPaymentAddressError(creationParameters.feeAddress, 'feeAddress');
    }
    if (creationParameters.maxRateTimespan && creationParameters.maxRateTimespan < 0) {
      throw new InvalidMaxRateTimespanError(creationParameters.maxRateTimespan);
    }
    return super.createCreationAction(creationParameters);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected abstract isValidAddress(_address: string, _networkName?: string): boolean;
}

export class InvalidMaxRateTimespanError extends Error {
  constructor(maxRateTimespan: number) {
    super(`${maxRateTimespan} is not a valid maxRateTimespan`);
  }
}
