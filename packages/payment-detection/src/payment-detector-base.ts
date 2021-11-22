import { BigNumber } from 'ethers';
import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import {
  BalanceError,
  ExtensionMissingRequiredValue,
  getBalanceErrorObject,
} from './balance-error';

export abstract class PaymentDetectorBase<
  TExtension extends ExtensionTypes.IExtension,
  TPaymentEventParameters
> implements PaymentTypes.IPaymentNetwork<TPaymentEventParameters> {
  public constructor(
    readonly paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    protected readonly extension: TExtension,
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
  ): Promise<PaymentTypes.IBalanceWithEvents<TPaymentEventParameters>> {
    try {
      const rawEvents = await this.getEvents(request);
      const events = this.sortEvents(this.filterEvents(request, rawEvents));
      const balance = this.computeBalance(events).toString();

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error);
    }
  }

  /**
   * Gets all paymnent events for a given Request
   */
  protected abstract getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[]>;

  protected getPaymentExtension(
    request: RequestLogicTypes.IRequest,
  ): TExtension extends ExtensionTypes.IExtension<infer X> ? ExtensionTypes.IState<X> : never {
    const extension = request.extensions[this.paymentNetworkId];
    if (!extension) {
      throw new BalanceError(
        `The request does not have the extension: ${this.paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }
    return extension as any;
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

  protected sortEvents(
    events: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[],
  ): PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[] {
    return events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  protected filterEvents(
    _request: RequestLogicTypes.IRequest,
    events: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[],
  ): PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[] {
    return events;
  }

  protected checkRequiredParameter<T>(value: T | undefined, name: string): value is T {
    if (!value) {
      throw new ExtensionMissingRequiredValue(this.paymentNetworkId, name);
    }
    return true;
  }
}
