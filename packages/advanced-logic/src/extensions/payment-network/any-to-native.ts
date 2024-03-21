import { FeeReferenceBasedPaymentNetwork } from './fee-reference-based';
import { ChainTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { InvalidPaymentAddressError, UnsupportedNetworkError } from './address-based';
import { ICurrencyManager } from '@requestnetwork/currency';

export default abstract class AnyToNativeTokenPaymentNetwork extends FeeReferenceBasedPaymentNetwork<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> {
  protected constructor(
    currencyManager: ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
    currentVersion: string,
    public readonly supportedNetworks: ChainTypes.IChain[],
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

  protected throwIfInvalidNetwork(chain?: string | ChainTypes.IChain): ChainTypes.IChain {
    const _chain = super.throwIfInvalidNetwork(chain);
    if (
      this.supportedNetworks &&
      !this.supportedNetworks.some((supportedChain) => supportedChain.eq(_chain))
    ) {
      throw new UnsupportedNetworkError(this.constructor.name, _chain.name, this.supportedNetworks);
    }
    return _chain;
  }
}

export class InvalidMaxRateTimespanError extends Error {
  constructor(maxRateTimespan: number) {
    super(`${maxRateTimespan} is not a valid maxRateTimespan`);
  }
}
