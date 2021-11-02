import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import BTCAddressedBased from './btc/mainnet-address-based';
import TestnetBTCAddressedBased from './btc/testnet-address-based';
import Declarative from './declarative';
import { ERC20AddressBasedPaymentDetector } from './erc20/address-based';
import { ERC20FeeProxyPaymentDetector } from './erc20/fee-proxy-contract';
import { ERC20ProxyPaymentDetector } from './erc20/proxy-contract';
import { EthInputDataPaymentDetector } from './eth/input-data';
import { EthFeeProxyPaymentDetector } from './eth/fee-proxy-detector';
import { AnyToERC20PaymentDetector } from './any/any-to-erc20-proxy';
import { NearNativeTokenPaymentDetector } from './near-detector';
import { AnyToEthFeeProxyPaymentDetector } from './any/any-to-eth-proxy';

/** Register the payment network by currency and type */
const supportedPaymentNetwork: PaymentTypes.ISupportedPaymentNetworkByCurrency = {
  BTC: {
    mainnet: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]: BTCAddressedBased,
    },
    testnet: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED]: TestnetBTCAddressedBased,
    },
  },
  ERC20: {
    '*': {
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED]: ERC20AddressBasedPaymentDetector,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: ERC20ProxyPaymentDetector,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector,
    },
  },
  ETH: {
    aurora: { [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN]: NearNativeTokenPaymentDetector },
    'aurora-testnet': {
      [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN]: NearNativeTokenPaymentDetector,
    },
    '*': {
      [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: EthInputDataPaymentDetector,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT]: EthFeeProxyPaymentDetector,
    },
  },
};

const anyCurrencyPaymentNetwork: PaymentTypes.IPaymentNetworkModuleByType = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY as string]: AnyToERC20PaymentDetector,
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: Declarative,
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY as string]: AnyToEthFeeProxyPaymentDetector,
};

/** Factory to create the payment network according to the currency and payment network type */
export default class PaymentNetworkFactory {
  /**
   * Creates a payment network according to payment network creation parameters
   * It throws if the payment network given is not supported by this library
   *
   * @param advancedLogic the advanced-logic layer in charge of the extensions
   * @param currency the currency of the request
   * @param paymentNetworkCreationParameters creation parameters of payment network
   * @param bitcoinDetectionProvider bitcoin detection provider
   * @param currencyManager the currency manager handling supported currencies
   * @returns the module to handle the payment network
   */
  public static createPaymentNetwork({
    advancedLogic,
    currency,
    paymentNetworkCreationParameters,
    bitcoinDetectionProvider,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currency: RequestLogicTypes.ICurrency;
    paymentNetworkCreationParameters: PaymentTypes.IPaymentNetworkCreateParameters;
    bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
    currencyManager: ICurrencyManager;
  }): PaymentTypes.IPaymentNetwork {
    const paymentNetworkForCurrency = this.supportedPaymentNetworksForCurrency(currency);

    if (!paymentNetworkForCurrency[paymentNetworkCreationParameters.id]) {
      throw new Error(
        `the payment network id: ${
          paymentNetworkCreationParameters.id
        } is not supported for the currency: ${currency.type} on network ${
          currency.network || 'mainnet'
        }`,
      );
    }

    return new paymentNetworkForCurrency[paymentNetworkCreationParameters.id]({
      advancedLogic,
      bitcoinDetectionProvider,
      currencyManager,
    });
  }

  /**
   * Gets the module to the payment network of a request
   * It throws if the payment network found is not supported by this library
   *
   * @param advancedLogic the advanced-logic layer in charge of the extensions
   * @param request the request
   * @param bitcoinDetectionProvider bitcoin detection provider
   * @param explorerApiKeys the explorer API (eg Etherscan) api keys, for PNs that rely on it. Record by network name.
   * @param currencyManager the currency manager handling supported currencies
   * @returns the module to handle the payment network or null if no payment network found
   */
  public static getPaymentNetworkFromRequest({
    advancedLogic,
    request,
    bitcoinDetectionProvider,
    explorerApiKeys,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    request: RequestLogicTypes.IRequest;
    currencyManager: ICurrencyManager;
    bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
    explorerApiKeys?: Record<string, string>;
  }): PaymentTypes.IPaymentNetwork | null {
    const currency = request.currency;
    const extensionPaymentNetwork = Object.values(request.extensions || {}).find(
      (extension) => extension.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
    );

    if (!extensionPaymentNetwork) {
      return null;
    }

    const paymentNetworkId = extensionPaymentNetwork.id;
    const paymentNetworkForCurrency = this.supportedPaymentNetworksForCurrency(currency);

    if (!paymentNetworkForCurrency[paymentNetworkId]) {
      throw new Error(
        `the payment network id: ${paymentNetworkId} is not supported for the currency: ${
          currency.type
        } on network ${currency.network || 'mainnet'}`,
      );
    }

    return new paymentNetworkForCurrency[paymentNetworkId]({
      advancedLogic,
      bitcoinDetectionProvider,
      explorerApiKeys,
      currencyManager,
    });
  }

  /**
   * Gets the payment networks supported for a Currency object
   *
   * @param currency The currency to get the supported networks for
   */
  public static supportedPaymentNetworksForCurrency(
    currency: RequestLogicTypes.ICurrency,
  ): PaymentTypes.IPaymentNetworkModuleByType {
    if (!supportedPaymentNetwork[currency.type]) {
      return anyCurrencyPaymentNetwork;
    }

    const paymentNetwork =
      supportedPaymentNetwork[currency.type][currency.network || 'mainnet'] ||
      supportedPaymentNetwork[currency.type]['*'];

    return { ...paymentNetwork, ...anyCurrencyPaymentNetwork };
  }

  /**
   * Checks if a networkId is part of the supported networks for given currency
   *
   * @param paymentNetworkId The networkId to check is supported by this currency
   * @param currency The currency to check the supported networks for
   */
  public static currencySupportsPaymentNetwork(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    currency: RequestLogicTypes.ICurrency,
  ): boolean {
    const paymentNetworks = this.supportedPaymentNetworksForCurrency(currency);
    return !!paymentNetworks[paymentNetworkId];
  }
}
