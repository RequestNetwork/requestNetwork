import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import getBalanceErrorObject from './balance-error';
import PaymentReferenceCalculator from './payment-reference-calculator';

import { BigNumber } from 'ethers';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export default abstract class ReferenceBasedDetector<TPaymentEventParameters>
  implements PaymentTypes.IPaymentNetworkDetection<TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extension, reference based
   * @param extensionType Example : ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA
   */
  public constructor(
    public extension: ExtensionTypes.PnReferenceBased.IReferenceBased,
    protected extensionType: ExtensionTypes.ID,
  ) {}

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents<TPaymentEventParameters>> {
    const paymentNetwork = request.extensions[this.extensionType];
    const paymentChain = this.getPaymentChain(request.currency, paymentNetwork);

    const supportedNetworks = this.extension.supportedNetworks;
    if (!supportedNetworks.includes(paymentChain)) {
      return getBalanceErrorObject(
        `Payment network ${paymentChain} not supported by ${
          this.extensionType
        } payment detection. Supported networks: ${supportedNetworks.join(', ')}`,
        PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
      );
    }

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension: ${this.extensionType}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }

    try {
      const payments = await this.extractBalanceAndEvents(
        paymentNetwork.values.paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        request.currency,
        request.requestId,
        paymentNetwork,
      );
      const refunds = await this.extractBalanceAndEvents(
        paymentNetwork.values.refundAddress,
        PaymentTypes.EVENTS_NAMES.REFUND,
        request.currency,
        request.requestId,
        paymentNetwork,
      );

      const balance: string = BigNumber.from(payments.balance || 0)
        .sub(BigNumber.from(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[] = [
        ...payments.events,
        ...refunds.events,
      ].sort(
        (
          a: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>,
          b: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>,
        ) => (a.timestamp || 0) - (b.timestamp || 0),
      );

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error.message);
    }
  }

  protected async extractBalanceAndEvents(
    paymentAddress: string | undefined,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    requestId: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IBalanceWithEvents<TPaymentEventParameters>> {
    if (paymentAddress) {
      const paymentReference = PaymentReferenceCalculator.calculate(
        requestId,
        paymentNetwork.values.salt,
        paymentAddress,
      );
      return await this.extractBalanceAndEventsFromPaymentRef(
        paymentAddress,
        eventName,
        requestCurrency,
        paymentReference,
        paymentNetwork,
      );
    }
    return { balance: '0', events: [] };
  }

  /**
   * Extracts the balance and events matching an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param paymentNetworkVersion the version of the payment network
   * @returns The balance
   */
  protected async extractBalanceAndEventsFromPaymentRef(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IBalanceWithEvents<TPaymentEventParameters>> {
    const events = await this.extractEvents(
      address,
      eventName,
      requestCurrency,
      paymentReference,
      paymentNetwork,
    );
    const balance = events
      .sort(
        (
          a: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>,
          b: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>,
        ) => (a.timestamp || 0) - (b.timestamp || 0),
      )
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
      .toString();

    return {
      balance,
      events,
    };
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected abstract extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[]>;

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getPaymentChain(
    requestCurrency: RequestLogicTypes.ICurrency,
    // eslint-disable-next-line
    _paymentNetwork: ExtensionTypes.IState<any>,
  ): string {
    const network = requestCurrency.network;
    if (!network) {
      throw Error('requestCurrency.network must be defined');
    }
    return network;
  }
}
