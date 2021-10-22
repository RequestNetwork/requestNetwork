import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import ReferenceBasedDetector from './reference-based-detector';
import { NearInfoRetriever } from './near-info-retriever';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment detection for NEAR native token payment
 */
export default class NearNativeTokenPaymentDetector extends ReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      advancedLogic,
      advancedLogic.extensions.nativeToken[0],
      ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
    );
  }

  public static getNearContractName = (
    chainName: string,
    paymentNetworkVersion = '0.2.0',
  ): string => {
    const version = NearNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    const versionMap: Record<string, Record<string, string>> = {
      aurora: { '0.1.0': 'requestnetwork.near', '0.2.0': 'requestnetwork.near' },
      'aurora-testnet': {
        '0.1.0': 'dev-1626339335241-5544297',
        '0.2.0': 'dev-1631521265288-35171138540673',
      },
    };
    if (versionMap[chainName]?.[version]) {
      return versionMap[chainName][version];
    }
    throw Error(`Unconfigured chain '${chainName}' and version '${version}'.`);
  };

  /**
   * Documentation: https://github.com/near/near-indexer-for-explorer
   */
  public static getProcedureName = (chainName: string, paymentNetworkVersion: string): string => {
    NearNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    switch (chainName) {
      case 'aurora':
        return 'com.nearprotocol.mainnet.explorer.select:INDEXER_BACKEND';
      case 'aurora-testnet':
        return 'com.nearprotocol.testnet.explorer.select:INDEXER_BACKEND';
    }
    throw new Error(`Invalid chain name '${chainName} for Near info retriever.`);
  };

  /**
   * Extracts the events for an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network state
   * @returns The balance with events
   */
  protected async extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const network = this.getPaymentChain(requestCurrency, paymentNetwork);

    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      address,
      NearNativeTokenPaymentDetector.getNearContractName(network, paymentNetwork.version),
      NearNativeTokenPaymentDetector.getProcedureName(network, paymentNetwork.version),
      eventName,
      network,
    );
    const events = await infoRetriever.getTransferEvents();
    return events;
  }

  protected static getVersionOrThrow = (paymentNetworkVersion: string): string => {
    if (!CONTRACT_ADDRESS_MAP[paymentNetworkVersion]) {
      throw Error(`Near payment detection not implemented for version ${paymentNetworkVersion}`);
    }
    return CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
  };
}
