import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';
import * as Types from '../../../types';

import BTCAddressBased from './address-based';

const PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED =
  ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED;
const TESTNET_BITCOIN_NETWORK_ID = 3;

/**
 * Handle payment networks with testnet BTC based address extension
 *
 * @class PaymentNetworkBTCAddressBased
 */
export default class PaymentNetworkBTCAddressBased implements Types.IPaymentNetwork {
  private btcAddressBased: BTCAddressBased;

  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.btcAddressBased = new BTCAddressBased(advancedLogic.extensions.addressBasedTestnetBtc);
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param paymentNetworkCreationParameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnBitcoinAddressBased.ICreationParameters,
  ): ExtensionTypes.IAction {
    return this.btcAddressBased.createExtensionsDataForCreation(paymentNetworkCreationParameters);
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnBitcoinAddressBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.btcAddressBased.createExtensionsDataForAddPaymentInformation(parameters);
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param parameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnBitcoinAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.btcAddressBased.createExtensionsDataForAddRefundInformation(parameters);
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(request: RequestLogicTypes.IRequest): Promise<Types.IBalanceWithEvents> {
    return this.btcAddressBased.getBalance(
      request,
      PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
      TESTNET_BITCOIN_NETWORK_ID,
    );
  }
}
