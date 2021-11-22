import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { DefaultBitcoinDetectionProvider } from './default-bitcoin-detection-provider';
import { PaymentDetectorBase } from '../payment-detector-base';

/**
 * Handle payment networks with BTC based address extension
 */
export abstract class BtcAddressBasedDetector extends PaymentDetectorBase<
  ExtensionTypes.PnAddressBased.IAddressBased<ExtensionTypes.PnAddressBased.ICreationParameters>,
  PaymentTypes.IBTCPaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor(
    private networkId: number,
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    extension: ExtensionTypes.PnAddressBased.IAddressBased<ExtensionTypes.PnAddressBased.ICreationParameters>,
    private bitcoinDetectionProvider: PaymentTypes.IBitcoinDetectionProvider = new DefaultBitcoinDetectionProvider(),
  ) {
    super(paymentNetworkId, extension);
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
   * @param Parameters to add payment information
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
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @returns The balance
   */
  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IBTCPaymentEventParameters>[]> {
    const { paymentAddress, refundAddress } = this.getPaymentExtension(request).values;

    if (!this.checkRequiredParameter(paymentAddress, 'paymentAddress')) {
      return [];
    }

    const [payments, refunds] = await Promise.all([
      await this.bitcoinDetectionProvider.getAddressBalanceWithEvents(
        this.networkId,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
      ),
      refundAddress
        ? await this.bitcoinDetectionProvider.getAddressBalanceWithEvents(
            this.networkId,
            refundAddress,
            PaymentTypes.EVENTS_NAMES.REFUND,
          )
        : { events: [] },
    ]);
    return [...payments.events, ...refunds.events];
  }
}
