import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import BTCAddressBased from './address-based';

const PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED =
  ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED;
const MAINNET_BITCOIN_NETWORK_ID = 0;

/**
 * Handle payment networks with mainnet BTC based address extension
 *
 * @class PaymentNetworkBTCAddressBased
 */
export default class PaymentNetworkBTCAddressBased
  implements PaymentTypes.IPaymentNetwork<PaymentTypes.IBTCPaymentEventParameters> {
  private btcAddressBased: BTCAddressBased;

  /**
   * @param advancedLogic Instance of Advanced Logic layer, to get the extension
   */
  public constructor({
    advancedLogic,
    bitcoinDetectionProvider,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  }) {
    this.btcAddressBased = new BTCAddressBased(
      advancedLogic.extensions.addressBasedBtc,
      bitcoinDetectionProvider,
    );
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param paymentNetworkCreationParameters
   *
   * @returns the extensions data object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
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
    parameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
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
    parameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.btcAddressBased.createExtensionsDataForAddRefundInformation(parameters);
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.BTCBalanceWithEvents> {
    return this.btcAddressBased.getBalance(
      request,
      PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
      MAINNET_BITCOIN_NETWORK_ID,
    );
  }
}
