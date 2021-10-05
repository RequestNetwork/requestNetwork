import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import getBalanceErrorObject from '../balance-error';
import Erc20InfoRetriever from './address-based-info-retriever';

import { BigNumber } from 'ethers';
const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Handle payment networks with ERC20 based address extension
 */
export default class PaymentNetworkERC20AddressBased
  implements PaymentTypes.IPaymentNetworkDetection<PaymentTypes.IPaymentEventParameters> {
  public extension: ExtensionTypes.IExtension;

  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions
      .addressBasedErc20 as ExtensionTypes.PnAddressBased.IAddressBased;
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents<PaymentTypes.IPaymentEventParameters>> {
    if (!request.currency.network) {
      request.currency.network = 'mainnet';
    }
    if (!supportedNetworks.includes(request.currency.network)) {
      return getBalanceErrorObject(
        `Payment network ${
          request.currency.network
        } not supported by ERC20 payment detection. Supported networks: ${supportedNetworks.join(
          ', ',
        )}`,
        PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
      );
    }
    try {
      const paymentAddress =
        request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED].values
          .paymentAddress;
      const refundAddress =
        request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED].values
          .refundAddress;

      let payments: PaymentTypes.IBalanceWithEvents<PaymentTypes.IPaymentEventParameters> = {
        balance: '0',
        events: [],
      };
      if (paymentAddress) {
        payments = await this.extractBalanceAndEvents(
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          request.currency.network,
          request.currency.value,
        );
      }

      let refunds: PaymentTypes.IBalanceWithEvents<PaymentTypes.IPaymentEventParameters> = {
        balance: '0',
        events: [],
      };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          request.currency.network,
          request.currency.value,
        );
      }

      const balance: string = BigNumber.from(payments.balance || 0)
        .sub(BigNumber.from(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IPaymentEventParameters>[] = [
        ...payments.events,
        ...refunds.events,
      ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error.message);
    }
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance
   */
  private async extractBalanceAndEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    tokenContractAddress: string,
  ): Promise<PaymentTypes.IBalanceWithEvents<PaymentTypes.IPaymentEventParameters>> {
    const infoRetriever = new Erc20InfoRetriever(tokenContractAddress, address, eventName, network);
    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
      .toString();

    return {
      balance,
      events,
    };
  }
}
