import { ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { AnyToAnyDetector } from './any-to-any-detector.js';
import { NativeDetectorOptions } from './types.js';

/**
 * Handle payment detection for native token payment with conversion
 */
export abstract class AnyToNativeDetector extends AnyToAnyDetector<
  ExtensionTypes.PnAnyToEth.IAnyToEth,
  PaymentTypes.IETHFeePaymentEventParameters
> {
  protected constructor({ network, advancedLogic, currencyManager }: NativeDetectorOptions) {
    const extensionId = ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN;
    const extension = advancedLogic.getAnyToNativeTokenExtensionForNetwork(
      network,
    ) as ExtensionTypes.PnAnyToEth.IAnyToEth;
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension, currencyManager);
  }
}
