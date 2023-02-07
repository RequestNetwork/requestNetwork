import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { NearChains, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { NearConversionInfoRetriever } from './retrievers/near-conversion-info-retriever';
import { AnyToNativeDetector } from '../any-to-native-detector';
import { NetworkNotSupported } from '../balance-error';
import { NativeDetectorOptions } from '../types';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment detection for NEAR native token payment with conversion
 */
export class NearConversionNativeTokenPaymentDetector extends AnyToNativeDetector {
  constructor(args: NativeDetectorOptions) {
    super(args);
  }

  public static getContractName = (chainName: string, paymentNetworkVersion = '0.1.0'): string => {
    const version =
      NearConversionNativeTokenPaymentDetector.getVersionOrThrow(paymentNetworkVersion);
    const versionMap: Record<string, Record<string, string>> = {
      aurora: { '0.1.0': 'native.conversion.reqnetwork.near' },
      near: { '0.1.0': 'native.conversion.reqnetwork.near' },
      'aurora-testnet': {
        '0.1.0': 'native.conversion.reqnetwork.testnet',
      },
      'near-testnet': {
        '0.1.0': 'native.conversion.reqnetwork.testnet',
      },
    };
    if (versionMap[chainName]?.[version]) {
      return versionMap[chainName][version];
    }
    throw new NetworkNotSupported(
      `Unconfigured near-conversion-detector chain '${chainName}' and version '${version}'`,
    );
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
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnAnyToEth.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkRetrieverEvents<PaymentTypes.ETHPaymentNetworkEvent>> {
    if (!address) {
      return {
        paymentEvents: [],
      };
    }

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw new UnsupportedCurrencyError(requestCurrency.value);
    }

    const infoRetriever = new NearConversionInfoRetriever(
      currency,
      paymentReference,
      address,
      NearConversionNativeTokenPaymentDetector.getContractName(
        paymentChain,
        paymentNetwork.version,
      ),
      eventName,
      paymentChain,
      paymentNetwork.values.maxRateTimespan,
    );
    const paymentEvents = await infoRetriever.getTransferEvents();
    return {
      paymentEvents,
    };
  }

  protected getPaymentChain(request: RequestLogicTypes.IRequest): CurrencyTypes.NearChainName {
    const network = this.getPaymentExtension(request).values.network;
    if (!network) {
      throw Error(`request.extensions[${this.paymentNetworkId}].values.network must be defined`);
    }
    NearChains.assertChainSupported(network);
    return network;
  }

  protected static getVersionOrThrow = (paymentNetworkVersion: string): string => {
    if (!CONTRACT_ADDRESS_MAP[paymentNetworkVersion]) {
      throw Error(`Near payment detection not implemented for version ${paymentNetworkVersion}`);
    }
    return CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
  };
}
