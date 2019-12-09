import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../../../types';
import ethInputDataInfoRetriever from './info-retriever';
import PaymentReferenceCalculator from './payment-reference-calculator';

const bigNumber: any = require('bn.js');
const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Handle payment networks with ETH input data extension
 */
export default class PaymentNetworkETHInputData implements Types.IPaymentNetwork {
  private extension: ExtensionTypes.PnReferenceBased.IReferenceBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.ethereumInputData;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public createExtensionsDataForCreation(
    paymentNetworkCreationParameters: Types.IEthInputDataCreationParameters,
  ): ExtensionTypes.IAction {
    // If no salt is given, generate one
    const salt = paymentNetworkCreationParameters.salt || Utils.crypto.generate8randomBytes();

    return this.extension.createCreationAction({
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      salt,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
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
    parameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
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
  public async getBalance(request: RequestLogicTypes.IRequest): Promise<Types.IBalanceWithEvents> {
    if (!request.currency.network) {
      request.currency.network = 'mainnet';
    }
    if (!supportedNetworks.includes(request.currency.network)) {
      throw new Error(
        `Payment network ${
          request.currency.network
        } not supported by ETH payment detection. Supported networks: ${supportedNetworks.join(
          ', ',
        )}`,
      );
    }
    const extensionValues: { paymentAddress: string; refundAddress: string; salt: string } =
      request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA].values;

    const paymentAddress = extensionValues.paymentAddress;
    const refundAddress = extensionValues.refundAddress;

    let payments: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (paymentAddress) {
      const paymentReferencePayment = PaymentReferenceCalculator.calculate(
        request.requestId,
        extensionValues.salt,
        paymentAddress,
      );
      payments = await this.extractBalanceAndEvents(
        paymentAddress,
        Types.EVENTS_NAMES.PAYMENT,
        request.currency.network,
        paymentReferencePayment,
      );
    }

    let refunds: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (refundAddress) {
      const paymentReferenceRefund = PaymentReferenceCalculator.calculate(
        request.requestId,
        extensionValues.salt,
        refundAddress,
      );
      refunds = await this.extractBalanceAndEvents(
        refundAddress,
        Types.EVENTS_NAMES.REFUND,
        request.currency.network,
        paymentReferenceRefund,
      );
    }

    const balance: string = new bigNumber(payments.balance || 0)
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
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @returns The balance
   */
  private async extractBalanceAndEvents(
    address: string,
    eventName: Types.EVENTS_NAMES,
    network: string,
    paymentReference: string,
  ): Promise<Types.IBalanceWithEvents> {
    const infoFromRetriever = await ethInputDataInfoRetriever(
      address,
      eventName,
      network,
      paymentReference,
    );

    const balance = infoFromRetriever.events
      .reduce((acc, event) => acc.add(new bigNumber(event.parameters.amount)), new bigNumber(0))
      .toString();

    return {
      balance,
      events: infoFromRetriever.events,
    };
  }
}
