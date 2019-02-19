import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';
import * as Types from '../../types';
import BTCAddressedBased from './btc/mainnet-address-based';
import TestnetBTCAddressedBased from './btc/testnet-address-based';

/** Register the payment network by currency and type */
const supportedPaymentNetwork: Types.ISupportedPaymentNetworkByCurrency = {
  BTC: {
    [ExtensionTypes.EXTENSION_ID
      .PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: BTCAddressedBased,
    [ExtensionTypes.EXTENSION_ID
      .PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: TestnetBTCAddressedBased,
  },
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
    currency: RequestLogicTypes.CURRENCY,
    paymentNetworkCreationParameters: Types.IPaymentNetworkCreateParameters,
  ): Types.IPaymentNetwork {
    const paymentNetworkForCurrency = supportedPaymentNetwork[currency];
    if (!paymentNetworkForCurrency) {
      throw new Error(`No payment network support the currency: ${currency}`);
    }
    if (!paymentNetworkForCurrency[paymentNetworkCreationParameters.id]) {
      throw new Error(
        `the payment network id: ${
          paymentNetworkCreationParameters.id
        } is not supported for the currency: ${currency}`,
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
      extension => extension.type === ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    );

    if (!extensionPaymentNetwork) {
      return null;
    }

    const paymentNetworkId = extensionPaymentNetwork.id;
    const paymentNetworkForCurrency = supportedPaymentNetwork[currency];
    if (!paymentNetworkForCurrency) {
      throw new Error(`No payment network support the currency: ${currency}`);
    }
    if (!paymentNetworkForCurrency[paymentNetworkId]) {
      throw new Error(
        `the payment network id: ${paymentNetworkId} is not supported for the currency: ${currency}`,
      );
    }

    return new paymentNetworkForCurrency[paymentNetworkId](advancedLogic);
  }
}
