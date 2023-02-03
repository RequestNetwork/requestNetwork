import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { NearInfoRetriever } from './retrievers/near-info-retriever';
import { NativeTokenPaymentDetector } from '../native-token-detector';
import { NetworkNotSupported } from '../balance-error';
import { NativeDetectorOptions } from '../types';

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
export class NearNativeTokenPaymentDetector extends NativeTokenPaymentDetector {
  constructor(args: NativeDetectorOptions) {
    super(args);
  }

  public static getContractName = (chainName: string, paymentNetworkVersion = '0.2.0'): string => {
    const version = NearNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    const versionMap: Record<string, Record<string, string>> = {
      aurora: { '0.1.0': 'requestnetwork.near', '0.2.0': 'requestnetwork.near' },
      'aurora-testnet': {
        '0.1.0': 'dev-1626339335241-5544297',
        '0.2.0': 'dev-1631521265288-35171138540673',
      },
      'near-testnet': {
        '0.1.0': 'dev-1626339335241-5544297',
        '0.2.0': 'dev-1631521265288-35171138540673',
      },
    };
    if (versionMap[chainName]?.[version]) {
      return versionMap[chainName][version];
    }
    throw new NetworkNotSupported(
      `Unconfigured near-detector chain '${chainName}' and version '${version}'`,
    );
  };

  /**
   * Extracts the events for an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network state
   * @returns The balance with events
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnReferenceBased.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkRetrieverEvents<PaymentTypes.ETHPaymentNetworkEvent>> {
    if (!address) {
      return {
        paymentEvents: [],
      };
    }
    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      address,
      NearNativeTokenPaymentDetector.getContractName(paymentChain, paymentNetwork.version),
      eventName,
      paymentChain,
    );
    const paymentEvents = await infoRetriever.getTransferEvents();
    return {
      paymentEvents,
    };
  }

  protected static getVersionOrThrow = (paymentNetworkVersion: string): string => {
    if (!CONTRACT_ADDRESS_MAP[paymentNetworkVersion]) {
      throw Error(`Near payment detection not implemented for version ${paymentNetworkVersion}`);
    }
    return CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
  };
}
