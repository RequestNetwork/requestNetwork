import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { BigNumber } from 'ethers';

/**
 * Handles payment detection for a declarative request, or derived.
 */
export abstract class DeclarativePaymentDetectorBase<
  TExtension extends ExtensionTypes.PnAnyDeclarative.IAnyDeclarative = ExtensionTypes.PnAnyDeclarative.IAnyDeclarative
> implements PaymentTypes.IPaymentNetwork<PaymentTypes.IDeclarativePaymentEventParameters> {
  public constructor(
    protected readonly _paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    protected readonly extension: TExtension,
  ) {}

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
    const events = this.getDeclarativeEvents(request);
    const balance = this.computeBalance(events);

    return {
      balance: balance.toString(),
      events,
    };
  }

  protected getDeclarativeEvents(
    request: RequestLogicTypes.IRequest,
  ): PaymentTypes.DeclarativePaymentNetworkEvent[] {
    const events = request.extensions[this._paymentNetworkId].events ?? [];
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

  protected computeBalance(events: PaymentTypes.IPaymentNetworkEvent<unknown>[]): BigNumber {
    return events.reduce(
      (sum, curr) =>
        curr.name === PaymentTypes.EVENTS_NAMES.PAYMENT
          ? sum.add(curr.amount)
          : curr.name === PaymentTypes.EVENTS_NAMES.REFUND
          ? sum.sub(curr.amount)
          : sum,
      BigNumber.from(0),
    );
  }

  protected sortEvents<T>(
    events: PaymentTypes.IPaymentNetworkEvent<T>[],
  ): PaymentTypes.IPaymentNetworkEvent<T>[] {
    return events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }
}

/**
 * Handles payment detection for a declarative request
 */
export class DeclarativePaymentDetector<
  TExtension extends ExtensionTypes.PnAnyDeclarative.IAnyDeclarative = ExtensionTypes.PnAnyDeclarative.IAnyDeclarative
> extends DeclarativePaymentDetectorBase<TExtension> {
  constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE, advancedLogic.extensions.declarative);
  }
}
