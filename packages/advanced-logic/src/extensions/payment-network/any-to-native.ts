import { FeeReferenceBasedPaymentNetwork } from './fee-reference-based';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError } from './address-based';

export default abstract class AnyToNativeTokenPaymentNetwork extends FeeReferenceBasedPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID,
    currentVersion: string,
    supportedNetworks: string[],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }

  public createCreationAction(
    creationParameters: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> {
    const network = creationParameters.network;
    if (!network) {
      throw Error('network is required');
    }
    if (!this.supportedNetworks.includes(network)) {
      throw Error(`network ${network} not supported`);
    }
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
  protected isValidAddress(_address: string, _networkName?: string): boolean {
    throw new Error(
      `Default implementation of isValidAddress() does not support native tokens. Please override this method.`,
    );
  }
}

export class InvalidMaxRateTimespanError extends Error {
  constructor(maxRateTimespan: number) {
    super(`${maxRateTimespan} is not a valid maxRateTimespan`);
  }
}
