import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import ReferenceBasedDetector from './reference-based-detector';
import { NearInfoRetriever } from './near-info-retriever';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment detection for NEAR native token payment
 */
export default class NearNativeTokenPaymentDetector extends ReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(advancedLogic.extensions.nativeToken[0], ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN);
  }

  public static getNearContractName = (chainName: string, paymentNetworkVersion = '0.1.0') => {
    NearNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    switch (chainName) {
      case 'aurora':
        return 'request-network';
      case 'aurora-testnet':
        return 'dev-1626339335241-5544297';
      default:
        throw Error(`Unconfigured chain '${chainName}'.`);
    }
  };

  /**
   * Extracts the events for an address and a payment reference
   *
   * @private
   * @param address Payment address
   * @param eventName Is it for payment or refund
   * @param network The payment network name
   * @param paymentReference The reference to identify the payment
   * @param paymentNetworkVersion
   * @returns The balance with events
   */
  protected async extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    paymentReference: string,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      address,
      NearNativeTokenPaymentDetector.getNearContractName(network, paymentNetworkVersion),
      NearNativeTokenPaymentDetector.getProcedureName(network, paymentNetworkVersion),
      eventName,
      network,
    );
    const events = await infoRetriever.getTransferEvents();
    return events;
  }

  /**
   * Documentation: https://github.com/near/near-indexer-for-explorer
   */
  protected static getProcedureName = (chainName: string, paymentNetworkVersion: string) => {
    NearNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    switch (chainName) {
      case 'aurora':
        return 'com.nearprotocol.mainnet.explorer.select:INDEXER_BACKEND';
      case 'aurora-testnet':
        return 'com.nearprotocol.testnet.explorer.select:INDEXER_BACKEND';
    }
    throw new Error(`Invalid chain name '${chainName} for Near info retriever.`);
  };

  protected static getVersionOrThrow = (paymentNetworkVersion: string) => {
    if (!CONTRACT_ADDRESS_MAP[paymentNetworkVersion]) {
      throw Error(`Near payment detection not implemented for version ${paymentNetworkVersion}`);
    }
    return CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
  };
}
