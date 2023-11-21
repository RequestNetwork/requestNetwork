import { CurrencyTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { AnyToAnyDetector } from './any-to-any-detector';
import { DetectorOptions } from './types';

/**
 * Handle payment detection for native token payment with conversion
 */
export abstract class AnyToNativeDetector<
  TChain extends CurrencyTypes.ChainName,
> extends AnyToAnyDetector<
  ExtensionTypes.PnAnyToEth.IAnyToEth,
  PaymentTypes.IETHFeePaymentEventParameters
> {
  protected constructor({ network, advancedLogic }: DetectorOptions<TChain>) {
    const extensionId = ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN;
    const extension = advancedLogic.getAnyToNativeTokenExtensionForNetwork(
      network,
    ) as ExtensionTypes.PnAnyToEth.IAnyToEth;
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension);
  }
}
