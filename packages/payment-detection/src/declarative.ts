import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { PaymentDetectorBase } from './payment-detector-base';

/**
 * Handles payment detection for a declarative request, or derived.
 */
export abstract class DeclarativePaymentDetectorBase<
  TExtension extends ExtensionTypes.PnAnyDeclarative.IAnyDeclarative,
  TPaymentEventParameters extends PaymentTypes.IDeclarativePaymentEventParameters,
> extends PaymentDetectorBase<TExtension, TPaymentEventParameters> {
  public constructor(_paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID, extension: TExtension) {
    super(_paymentNetworkId, extension);
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
      salt: paymentNetworkCreationParameters.salt,
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
      txHash: parameters.txHash,
      network: parameters.network,
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
      txHash: parameters.txHash,
      network: parameters.network,
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
      txHash: parameters.txHash,
      network: parameters.network,
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
      txHash: parameters.txHash,
      network: parameters.network,
    });
  }

  /**
   * Creates the extensions data to declare a delegate
   *
   * @param Parameters to declare declare a delegate
   * @returns The extensionData object
   */
  public createExtensionsDataForAddDelegate(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddDelegateParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddDelegateAction({
      delegate: parameters.delegate,
    });
  }

  /**
   * The balance of a request using declarative payment network is the sum of declared received payments
   * subtracted by the sum of the declared received refund
   */
  protected getDeclarativeEvents(
    request: RequestLogicTypes.IRequest,
  ): PaymentTypes.DeclarativePaymentNetworkEvent[] {
    const events = this.getPaymentExtension(request).events ?? [];
    // For each extension data related to the declarative payment network,
    // Received payment increase the balance and received refund decrease the balance
    return events
      .map((data) => {
        const { amount, txHash, network, note } = data.parameters;
        const nameMap: Partial<Record<string, PaymentTypes.EVENTS_NAMES>> = {
          [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT]:
            PaymentTypes.EVENTS_NAMES.PAYMENT,
          [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND]:
            PaymentTypes.EVENTS_NAMES.REFUND,
        };

        const name = nameMap[data.name];
        if (name) {
          return {
            amount,
            name,
            parameters: {
              txHash,
              network,
              note,
              from: data.from,
            },
            timestamp: data.timestamp,
          };
        }
        return null;
      })
      .filter(Utils.notNull);
  }
}

/**
 * Handles payment detection for a declarative request
 */
export class DeclarativePaymentDetector extends DeclarativePaymentDetectorBase<
  ExtensionTypes.PnAnyDeclarative.IAnyDeclarative,
  PaymentTypes.IDeclarativePaymentEventParameters
> {
  constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE, advancedLogic.extensions.declarative);
  }

  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IDeclarativePaymentEventParameters>> {
    return {
      paymentEvents: this.getDeclarativeEvents(request),
    };
  }
}
