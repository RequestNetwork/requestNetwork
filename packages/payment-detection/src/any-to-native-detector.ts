import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { AnyToAnyDetector } from './any-to-any-detector';
import { ICurrencyManager } from '@requestnetwork/currency';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';

/**
 * Handle payment detection for native token payment with conversion
 */
export abstract class AnyToNativeDetector extends AnyToAnyDetector<
  ExtensionTypes.PnAnyToEth.IAnyToEth,
  PaymentTypes.IETHPaymentEventParameters
> {
  public constructor({
    network,
    advancedLogic,
    currencyManager,
  }: {
    network: string;
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
  }) {
    const extensionId = PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE;
    const extension = advancedLogic.extensions.anyToNativeToken.find(
      (nativeTokenExtension: AdvancedLogic['extensions']['anyToNativeToken'][number]) =>
        nativeTokenExtension.supportedNetworks.includes(network),
    );
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension, currencyManager);
  }
}
