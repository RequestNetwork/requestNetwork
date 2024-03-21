import { ChainTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { ReferenceBasedDetector } from './reference-based-detector';
import { NativeDetectorOptions } from './types';

/**
 * Handle payment detection for native token payment
 */
export abstract class NativeTokenPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IETHPaymentEventParameters
> {
  protected readonly network: ChainTypes.INearChain | undefined;
  protected readonly getSubgraphClient: NativeDetectorOptions['getSubgraphClient'];
  protected constructor({
    network,
    advancedLogic,
    currencyManager,
    getSubgraphClient,
  }: NativeDetectorOptions) {
    const extensionId = ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN;
    const extension = advancedLogic.getNativeTokenExtensionForNetwork(
      network,
    ) as ExtensionTypes.PnReferenceBased.IReferenceBased;
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension, currencyManager, [ChainTypes.ECOSYSTEM.NEAR]);
    this.getSubgraphClient = getSubgraphClient;
    this.network = network;
  }
}
