import { CurrencyTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { ReferenceBasedDetector } from './reference-based-detector';
import { NativeDetectorOptions } from './types';

/**
 * Handle payment detection for native token payment
 */
export abstract class NativeTokenPaymentDetector<
  TChain extends CurrencyTypes.ChainName,
> extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IETHPaymentEventParameters,
  TChain
> {
  protected readonly network: TChain | undefined;
  protected constructor({
    network,
    advancedLogic,
    currencyManager,
    getSubgraphClient,
    subgraphMinIndexedBlock,
  }: NativeDetectorOptions<TChain>) {
    const extensionId = ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN;
    const extension = advancedLogic.getNativeTokenExtensionForNetwork(
      network,
    ) as ExtensionTypes.PnReferenceBased.IReferenceBased;
    if (!extension) {
      throw new Error(`the ${extensionId} extension is not supported for the network ${network}`);
    }
    super(extensionId, extension, currencyManager, getSubgraphClient, subgraphMinIndexedBlock);
    this.network = network;
  }
}
