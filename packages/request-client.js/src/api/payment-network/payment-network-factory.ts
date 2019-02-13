import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import * as Types from '../../types';
import BTCAddressedBased from './btc/mainnet-address-based';
import TestnetBTCAddressedBased from './btc/testnet-address-based';

/** Register the payment network from currency and type */
const supportedPaymentNetwork: Types.ISupportedPaymentNetworkByCurrency = {
  BTC: {
    [ExtensionTypes.EXTENSION_ID
      .PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: BTCAddressedBased,
    [ExtensionTypes.EXTENSION_ID
      .PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: TestnetBTCAddressedBased,
  },
};

/** Factory to create the payment network according to the currency and payment network type */
export default {
  /**
   * Creates a payment network according to payment network creation parameters
   * It throws if the payment network given is not supported by this library
   *
   * @param {AdvancedLogicTypes.IAdvancedLogic} advancedLogic the advanced-logic layer in charge of the extensions
   * @param {RequestLogicTypes.REQUEST_LOGIC_CURRENCY} currency the currency of the request
   * @param {Types.IPaymentNetworkCreateParameters} paymentNetworkCreationParameters creation parameters of payment network
   * @returns {Types.IPaymentNetwork} the module to handle the payment network
   */
  createPaymentNetwork(
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY,
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
  },
  /**
   * Gets the module to the payment network of a request
   * It throws if the payment network found is not supported by this library
   *
   * @param {AdvancedLogicTypes.IAdvancedLogic} advancedLogic the advanced-logic layer in charge of the extensions
   * @param {RequestLogicTypes.IRequestLogicRequest} request the request
   * @returns {(Types.IPaymentNetwork | null)} the module to handle the payment network or null if no payment network found
   */
  getPaymentNetworkFromRequest(
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    request: RequestLogicTypes.IRequestLogicRequest,
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
  },
  supportedPaymentNetwork,
};
