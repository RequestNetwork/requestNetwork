import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Erc20InfoRetriever from './address-based-info-retriever';

import { PaymentDetectorBase } from '../payment-detector-base';

/**
 * Handle payment networks with ERC20 based address extension
 */
export class ERC20AddressBasedPaymentDetector extends PaymentDetectorBase<
  ExtensionTypes.PnAddressBased.IAddressBased<ExtensionTypes.PnAddressBased.ICreationParameters>,
  PaymentTypes.IERC20PaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
      advancedLogic.extensions.addressBasedErc20,
    );
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
  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20PaymentEventParameters>> {
    if (!request.currency.network) {
      request.currency.network = 'mainnet';
    }

    const { paymentAddress, refundAddress } = this.getPaymentExtension(request).values;
    this.checkRequiredParameter(paymentAddress, 'paymentAddress');

    const paymentEvents = await this.extractTransferEvents(
      paymentAddress,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      request.currency.network,
      request.currency.value,
    );

    const refundEvents = await this.extractTransferEvents(
      refundAddress,
      PaymentTypes.EVENTS_NAMES.REFUND,
      request.currency.network,
      request.currency.value,
    );

    const allPaymentEvents = [...paymentEvents, ...refundEvents];
    return {
      paymentEvents: allPaymentEvents,
    };
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
  private async extractTransferEvents(
    address: string | undefined,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    tokenContractAddress: string,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20PaymentEventParameters>[]> {
    if (!address) {
      return [];
    }
    const infoRetriever = new Erc20InfoRetriever(tokenContractAddress, address, eventName, network);
    return infoRetriever.getTransferEvents();
  }
}
