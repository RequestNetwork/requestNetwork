import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import getBalanceErrorObject from '../balance-error';
import Erc20InfoRetriever from './address-based-info-retriever';

const bigNumber: any = require('bn.js');
const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Handle payment networks with ERC20 based address extension
 */
export default class PaymentNetworkERC20AddressBased
  implements PaymentTypes.IPaymentNetwork<PaymentTypes.IERC20PaymentEventParameters> {
  private extension: ExtensionTypes.PnAddressBased.IAddressBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.addressBasedErc20;
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    return this.extension.createCreationAction({
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
    });
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.ERC20BalanceWithEvents> {
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

      let payments: PaymentTypes.ERC20BalanceWithEvents = { balance: '0', events: [] };
      if (paymentAddress) {
        payments = await this.extractBalanceAndEvents(
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          request.currency.network,
          request.currency.value,
        );
      }

      let refunds: PaymentTypes.ERC20BalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          request.currency.network,
          request.currency.value,
        );
      }

      const balance: string = new bigNumber(payments.balance || 0)
        .sub(new bigNumber(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.ERC20PaymentNetworkEvent[] = [
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
  ): Promise<PaymentTypes.ERC20BalanceWithEvents> {
    const infoRetriever = new Erc20InfoRetriever(tokenContractAddress, address, eventName, network);
    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(new bigNumber(event.amount)), new bigNumber(0))
      .toString();

    return {
      balance,
      events,
    };
  }
}
