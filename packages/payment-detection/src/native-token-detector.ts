import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { ReferenceBasedDetector } from './reference-based-detector';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';

/**
 * Handle payment detection for native token payment
 */
export abstract class NativeTokenPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IETHPaymentEventParameters
> {
  public constructor({
    network,
    advancedLogic,
  }: {
    network: string;
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  }) {
    const extensionId = PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN;
    const extension = advancedLogic.extensions.nativeToken.find(
      (nativeTokenExtension: AdvancedLogic['extensions']['nativeToken'][number]) =>
        nativeTokenExtension.supportedNetworks.includes(network),
    );
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension);
  }
}
