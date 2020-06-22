import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
const bigNumber: any = require('bn.js');

/**
 * Handle payment networks with declarative requests extension
 *
 * @class PaymentNetworkDeclarative
 */
export default class PaymentNetworkDeclarative
  implements PaymentTypes.IPaymentNetwork<PaymentTypes.IDeclarativePaymentEventParameters> {
  private extension: ExtensionTypes.PnAnyDeclarative.IAnyDeclarative;

  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.declarative;
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param any paymentNetworkCreationParameters
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnAnyDeclarative.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    return this.extension.createCreationAction({
      paymentInfo: paymentNetworkCreationParameters.paymentInfo,
      refundInfo: paymentNetworkCreationParameters.refundInfo,
    });
  }

  /**
   * Creates the extensions data to add payment info
   *
   * @param Parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddPaymentInstructionParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentInstructionAction({
      paymentInfo: parameters.paymentInfo,
    });
  }

  /**
   * Creates the extensions data to add refund info
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddRefundInstructionParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundInstructionAction({
      refundInfo: parameters.refundInfo,
    });
  }

  /**
   * Creates the extensions data to declare a payment is sent
   *
   * @param Parameters to declare sent payment
   * @returns The extensionData object
   */
  public createExtensionsDataForDeclareSentPayment(
    parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createDeclareSentPaymentAction({
      amount: parameters.amount,
      note: parameters.note,
    });
  }

  /**
   * Creates the extensions data to declare a refund is sent
   *
   * @param Parameters to declare sent refund
   * @returns The extensionData object
   */
  public createExtensionsDataForDeclareSentRefund(
    parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createDeclareSentRefundAction({
      amount: parameters.amount,
      note: parameters.note,
    });
  }

  /**
   * Creates the extensions data to declare a payment is received
   *
   * @param Parameters to declare received payment
   * @returns The extensionData object
   */
  public createExtensionsDataForDeclareReceivedPayment(
    parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createDeclareReceivedPaymentAction({
      amount: parameters.amount,
      note: parameters.note,
    });
  }

  /**
   * Creates the extensions data to declare a refund is received
   *
   * @param Parameters to declare received refund
   * @returns The extensionData object
   */
  public createExtensionsDataForDeclareReceivedRefund(
    parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createDeclareReceivedRefundAction({
      amount: parameters.amount,
      note: parameters.note,
    });
  }

  /**
   * Gets the balance and the payment/refund events
   * The balance of a request using declarative payment network is the sum of declared received payments
   * subtracted by the sum of the declared received refund
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.DeclarativeBalanceWithEvents> {
    let balance = new bigNumber(0);
    const events: PaymentTypes.DeclarativePaymentNetworkEvent[] = [];

    // For each extension data related to the declarative payment network,
    // we check if the data is a declared received payment or refund and we modify the balance
    // Received payment increase the balance and received refund decrease the balance
    request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE].events.forEach(data => {
      const parameters = data.parameters;
      if (data.name === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT) {
        // Declared received payments from payee is added to the balance
        balance = balance.add(new bigNumber(parameters.amount));
        events.push({
          amount: parameters.amount,
          name: PaymentTypes.EVENTS_NAMES.PAYMENT,
          parameters: {
            note: parameters.note,
          },
          timestamp: data.timestamp,
        });
      } else if (data.name === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND) {
        parameters.timestamp = data.timestamp;

        // The balance is subtracted from declared received refunds from payer
        balance = balance.sub(new bigNumber(parameters.amount));
        events.push({
          amount: parameters.amount,
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            note: parameters.note,
          },
          timestamp: data.timestamp,
        });
      }
    });

    return {
      balance: balance.toString(),
      events,
    };
  }
}
