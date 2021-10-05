import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { BigNumber } from 'ethers';

/**
 * Handle payment networks with declarative requests extension
 *
 * @class PaymentNetworkDeclarative
 */
export default class PaymentNetworkDeclarative
  implements
    PaymentTypes.IPaymentNetworkDetection<PaymentTypes.IDeclarativePaymentEventParameters> {
  public extension: ExtensionTypes.PnAnyDeclarative.IAnyDeclarative;
  protected extensionType: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE;

  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions
      .declarative as ExtensionTypes.PnAnyDeclarative.IAnyDeclarative;
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
    let balance = BigNumber.from(0);
    const events: PaymentTypes.DeclarativePaymentNetworkEvent[] = [];

    // For each extension data related to the declarative payment network,
    // we check if the data is a declared received payment or refund and we modify the balance
    // Received payment increase the balance and received refund decrease the balance
    request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE].events.forEach((data) => {
      const parameters = data.parameters;
      if (data.name === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT) {
        // Declared received payments from payee is added to the balance
        balance = balance.add(BigNumber.from(parameters.amount));
        events.push({
          amount: parameters.amount,
          name: PaymentTypes.EVENTS_NAMES.PAYMENT,
          parameters: {
            note: parameters.note,
            from: data.from,
          },
          timestamp: data.timestamp,
        });
      } else if (data.name === ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND) {
        parameters.timestamp = data.timestamp;

        // The balance is subtracted from declared received refunds from payer
        balance = balance.sub(BigNumber.from(parameters.amount));
        events.push({
          amount: parameters.amount,
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            note: parameters.note,
            from: data.from,
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
