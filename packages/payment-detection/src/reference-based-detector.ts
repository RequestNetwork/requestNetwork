import { ExtensionTypes, PaymentTypes, RequestLogicTypes, TypesUtils } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { BalanceError } from './balance-error';
import PaymentReferenceCalculator from './payment-reference-calculator';

import { DeclarativePaymentDetectorBase } from './declarative';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export abstract class ReferenceBasedDetector<
    TExtension extends ExtensionTypes.PnReferenceBased.IReferenceBased,
    TPaymentEventParameters
  >
  extends DeclarativePaymentDetectorBase<
    TExtension,
    TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
  >
  implements
    PaymentTypes.IPaymentNetwork<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    > {
  /**
   * @param extension The advanced logic payment network extension, reference based
   * @param extensionType Example : PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA
   */

  public constructor(paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID, extension: TExtension) {
    super(paymentNetworkId, extension, (request) => this.getEvents(request));
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

  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[]
  > {
    const paymentNetwork = request.extensions[this._paymentNetworkId];
    const paymentChain = this.getPaymentChain(request.currency, paymentNetwork);

    const supportedNetworks = this.extension.supportedNetworks;
    if (!supportedNetworks.includes(paymentChain)) {
      throw new BalanceError(
        `Payment network ${paymentChain} not supported by ${
          this._paymentNetworkId
        } payment detection. Supported networks: ${supportedNetworks.join(', ')}`,
        PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
      );
    }

    if (!paymentNetwork) {
      throw new BalanceError(
        `The request does not have the extension: ${this._paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }

    const [paymentEvents, refundEvents] = await Promise.all([
      this.extractTransferEvents(
        paymentNetwork.values.paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        request.currency,
        request.requestId,
        paymentNetwork,
      ),
      this.extractTransferEvents(
        paymentNetwork.values.refundAddress,
        PaymentTypes.EVENTS_NAMES.REFUND,
        request.currency,
        request.requestId,
        paymentNetwork,
      ),
    ]);

    const declaredEvents = this.getDeclarativeEvents(request);
    return [...declaredEvents, ...paymentEvents, ...refundEvents];
  }

  private async extractTransferEvents(
    paymentAddress: string | undefined,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    requestId: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[]> {
    if (!paymentAddress) {
      return [];
    }
    const paymentReference = PaymentReferenceCalculator.calculate(
      requestId,
      paymentNetwork.values.salt,
      paymentAddress,
    );

    return this.extractEvents(
      paymentAddress,
      eventName,
      requestCurrency,
      paymentReference,
      paymentNetwork,
    );
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
