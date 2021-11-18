import { BigNumber } from 'ethers';
import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { getBalanceErrorObject } from './balance-error';

export abstract class PaymentDetectorBase<
  TExtension extends ExtensionTypes.IExtension,
  TEventParameters
> implements PaymentTypes.IPaymentNetwork<TEventParameters> {
  public constructor(
    protected readonly _paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    protected readonly extension: TExtension,
    protected readonly fetchEvents: (
      request: RequestLogicTypes.IRequest,
    ) => Promise<PaymentTypes.IPaymentNetworkEvent<TEventParameters>[]>,
  ) {}
  abstract createExtensionsDataForCreation(paymentNetworkCreationParameters: any): Promise<any>;
  abstract createExtensionsDataForAddRefundInformation(parameters: any): any;
  abstract createExtensionsDataForAddPaymentInformation(parameters: any): any;

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents<TEventParameters>> {
    try {
      const events = await this.fetchEvents(request);
      const balance = this.computeBalance(events).toString();

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error);
    }
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
