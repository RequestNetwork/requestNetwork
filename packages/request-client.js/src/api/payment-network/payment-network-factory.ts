import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import * as Types from '../../types';
import BTCAddressedBased from './btc/mainnet-address-based';
import TestnetBTCAddressedBased from './btc/testnet-address-based';
import Declarative from './declarative';
import ERC20AddressBased from './erc20/address-based';

/** Register the payment network by currency and type */
// TODO: take into account currency network and possibly value when finding supported network
const supportedPaymentNetwork: Types.ISupportedPaymentNetworkByCurrency = {
  BTC: {
    mainnet: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: BTCAddressedBased,
    },
    testnet: {
      [ExtensionTypes.ID
        .PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: TestnetBTCAddressedBased,
    },
  },
  ERC20: {
    mainnet: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED as string]: ERC20AddressBased,
    },
    rinkeby: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED as string]: ERC20AddressBased,
    },
  },
};

const anyCurrencyPaymentNetwork: Types.IPaymentNetworkModuleByType = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: Declarative,
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
   * @returns the module to handle the payment network
   */
  public static createPaymentNetwork(
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    currency: RequestLogicTypes.ICurrency,
    paymentNetworkCreationParameters: Types.IPaymentNetworkCreateParameters,
  ): Types.IPaymentNetwork {
    const paymentNetworkForCurrency = supportedPaymentNetworksForCurrency(currency);

    if (!paymentNetworkForCurrency[paymentNetworkCreationParameters.id]) {
      throw new Error(
        `the payment network id: ${
          paymentNetworkCreationParameters.id
        } is not supported for the currency: ${currency.type} on network ${currency.network ||
          'mainnet'}`,
      );
    }

    return new paymentNetworkForCurrency[paymentNetworkCreationParameters.id](advancedLogic);
  }

  /**
   * Gets the module to the payment network of a request
   * It throws if the payment network found is not supported by this library
   *
   * @param advancedLogic the advanced-logic layer in charge of the extensions
   * @param request the request
   * @returns the module to handle the payment network or null if no payment network found
   */
  public static getPaymentNetworkFromRequest(
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    request: RequestLogicTypes.IRequest,
  ): Types.IPaymentNetwork | null {
    const currency = request.currency;
    const extensionPaymentNetwork = Object.values(request.extensions || {}).find(
      extension => extension.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
    );

    if (!extensionPaymentNetwork) {
      return null;
    }

    const paymentNetworkId = extensionPaymentNetwork.id;
    const paymentNetworkForCurrency = supportedPaymentNetworksForCurrency(currency);

    if (!paymentNetworkForCurrency[paymentNetworkId]) {
      throw new Error(
        `the payment network id: ${paymentNetworkId} is not supported for the currency: ${
          currency.type
        } on network ${currency.network || 'mainnet'}`,
      );
    }

    return new paymentNetworkForCurrency[paymentNetworkId](advancedLogic);
  }
}

/**
 * Gets the payment networks supported for a Currency object
 *
 * @param currency The currency to get the supported networks for
 */
function supportedPaymentNetworksForCurrency(
  currency: RequestLogicTypes.ICurrency,
): Types.IPaymentNetworkModuleByType {
  if (!supportedPaymentNetwork[currency.type]) {
    return anyCurrencyPaymentNetwork;
  }

  const paymentNetwork =
    supportedPaymentNetwork[currency.type][currency.network || 'mainnet'] || {};

  return { ...paymentNetwork, ...anyCurrencyPaymentNetwork };
}
