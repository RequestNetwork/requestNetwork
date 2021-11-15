import { ExtensionTypes, PaymentTypes, RequestLogicTypes, TypesUtils } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import getBalanceErrorObject from './balance-error';
import PaymentReferenceCalculator from './payment-reference-calculator';

import { BigNumber } from 'ethers';
import { DeclarativePaymentDetectorBase } from './declarative';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export abstract class ReferenceBasedDetector<
    TPaymentEventParameters,
    TExtension extends ExtensionTypes.PnReferenceBased.IReferenceBased = ExtensionTypes.PnReferenceBased.IReferenceBased
  >
  extends DeclarativePaymentDetectorBase<TExtension>
  implements
    PaymentTypes.IPaymentNetwork<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    > {
  /**
   * @param extension The advanced logic payment network extension, reference based
   * @param extensionType Example : ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA
   */

  public constructor(paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID, extension: TExtension) {
    super(paymentNetworkId, extension);
    if (!TypesUtils.isPaymentNetworkId(paymentNetworkId)) {
      throw new Error(
        `Cannot detect payment for extension type '${paymentNetworkId}', it is not a payment network ID.`,
      );
    }
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnReferenceBased.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    paymentNetworkCreationParameters.salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      ...paymentNetworkCreationParameters,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment address
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentAddress(
    parameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund address
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundAddress(
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
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IBalanceWithEvents<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >
  > {
    const paymentNetwork = request.extensions[this._paymentNetworkId];
    const paymentChain = this.getPaymentChain(request.currency, paymentNetwork);

    const supportedNetworks = this.extension.supportedNetworks;
    if (!supportedNetworks.includes(paymentChain)) {
      return getBalanceErrorObject(
        `Payment network ${paymentChain} not supported by ${
          this._paymentNetworkId
        } payment detection. Supported networks: ${supportedNetworks.join(', ')}`,
        PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
      );
    }

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension: ${this._paymentNetworkId}`,
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

      const declaredBalance = await super.getBalance(request);

      const balance: string = BigNumber.from(declaredBalance.balance)
        .add(payments.balance || 0)
        .sub(refunds.balance || 0)
        .toString();

      const events: PaymentTypes.IPaymentNetworkEvent<
        TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
      >[] = [...declaredBalance.events, ...payments.events, ...refunds.events].sort(
        (
          a: PaymentTypes.IPaymentNetworkEvent<
            TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
          >,
          b: PaymentTypes.IPaymentNetworkEvent<
            TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
          >,
        ) => (a.timestamp || 0) - (b.timestamp || 0),
      );

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject((error as Error).message);
    }
  }

  // FIXME: should return declarative events and balance
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
  // FIXME: should return declarative events and balance
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
  // FIXME: should return declarative events
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
