import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';
import * as Types from '../../../types';

import BitcoinInfoRetriever from './bitcoin-info-retriever';

const bigNumber: any = require('bn.js');

const PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED =
  ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED;
/**
 * Entry point to handle payment networks with BTC based address
 *
 * @class PaymentNetworkBTCAddressBased
 */
export default class PaymentNetworkBTCAddressBased implements Types.IPaymentNetworkManager {
  private extensionManager: ExtensionTypes.PnBitcoinAddressBased.IBitcoinAddressBasedManager;

  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.extensionManager = advancedLogic.extensions.addressBasedBtc;
  }

  /** Creates the extensions data for the creation of this extension
   *
   * @param any paymentNetworkCreationParameters
   *
   * @returns any the extensions data object
   */
  public createExtensionsDataForCreation(paymentNetworkCreationParameters: any): any {
    return this.extensionManager.createCreationAction({
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
    });
  }

  /** Creates the extensions data to add payment address
   *
   * @param any parameters
   *
   * @returns any the extensions data object
   */
  public createExtensionsDataForAddPaymentInformation(parameters: any): any {
    return this.extensionManager.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /** Creates the extensions data to add refund address
   *
   * @param any parameters
   *
   * @returns any the extensions data object
   */
  public createExtensionsDataForAddRefundInformation(parameters: any): any {
    return this.extensionManager.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
    });
  }

  public async getBalance(
    request: RequestLogicTypes.IRequestLogicRequest,
  ): Promise<Types.IBalanceWithEvents> {
    if (!request.extensions[PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]) {
      throw new Error(
        `The request do not have the extension : ̀${PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED}`,
      );
    }
    const paymentAddress =
      request.extensions[PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED].values.paymentAddress;
    const refundAddress =
      request.extensions[PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED].values.refundAddress;

    let payments: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (paymentAddress) {
      payments = await this.extractBalanceAndEvents(paymentAddress, Types.EVENTS_NAMES.PAYMENT);
    }

    let refunds: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (refundAddress) {
      refunds = await this.extractBalanceAndEvents(refundAddress, Types.EVENTS_NAMES.REFUND);
    }

    const balance: string = new bigNumber(new bigNumber(payments.balance || 0))
      .sub(new bigNumber(refunds.balance || 0))
      .toString();

    const events: Types.IPaymentNetworkEvent[] = [...payments.events, ...refunds.events].sort(
      (a: Types.IPaymentNetworkEvent, b: Types.IPaymentNetworkEvent) =>
        a.parameters.timestamp - b.parameters.timestamp,
    );

    return {
      balance,
      events,
    };
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param {string} address address to check
   * @param {Types.EVENTS_NAMES} eventName Indicate if it is an address for payment or refund
   * @returns {Promise<Types.IBalanceWithEvents>}
   * @memberof PaymentNetworkBTCAddressBased
   */
  private async extractBalanceAndEvents(
    address: string,
    eventName: Types.EVENTS_NAMES,
  ): Promise<Types.IBalanceWithEvents> {
    // TODO PROT-326: Add a way to change the bitcoin network
    return BitcoinInfoRetriever.getAddressInfo(3, address, eventName);
  }
}
