import { IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
import { currencyToString } from './currency';
import PaymentNetworkDeclarative from './payment-network/declarative';
import localUtils from './utils';

/**
 * Class representing a request.
 * Instances of this class can be accepted, paid, refunded, etc.
 * Use the member function `getData` to access the properties of the Request.
 *
 * Requests should be created with `RequestNetwork.createRequest()`.
 */
export default class Request {
  /**
   * Unique ID of the request
   */
  public readonly requestId: RequestLogicTypes.RequestId;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private paymentNetwork: Types.IPaymentNetwork | null = null;
  private contentDataExtension: ContentDataExtension | null;

  /**
   * Data of the request (see request-logic)
   */
  private requestData: RequestLogicTypes.IRequest | null = null;

  /**
   * Pending data of the request (see request-logic)
   */
  // TODO modify any to a real type
  private pendingData: any | null = null;

  /**
   * Content data parsed from the extensions data
   */
  private contentData: any | null = null;

  /**
   * Meta data of the request (e.g: where the data have been retrieved from)
   */
  private requestMeta: RequestLogicTypes.IReturnMeta | null = null;

  /**
   * Balance and payments/refund events
   */
  private balance: Types.IBalanceWithEvents | null = null;

  /**
   * Creates an instance of Request
   *
   * @param requestLogic Instance of the request-logic layer
   * @param requestId ID of the Request
   * @param paymentNetwork Instance of a payment network to manage the request
   * @param contentDataManager Instance of content data manager
   */
  constructor(
    requestLogic: RequestLogicTypes.IRequestLogic,
    requestId: RequestLogicTypes.RequestId,
    paymentNetwork?: Types.IPaymentNetwork | null,
    contentDataExtension?: ContentDataExtension | null,
  ) {
    this.requestLogic = requestLogic;
    this.requestId = requestId;
    this.contentDataExtension = contentDataExtension || null;
    this.paymentNetwork = paymentNetwork || null;
  }

  /**
   * Accepts a request
   *
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async accept(
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }
    const parameters: RequestLogicTypes.IAcceptParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.acceptRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Cancels a request
   *
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async cancel(
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }

    const parameters: RequestLogicTypes.ICancelParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.cancelRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Increases the expected amount of the request.
   *
   * @param deltaAmount Amount by which to increase the expected amount
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async increaseExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.Amount,
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }
    const parameters: RequestLogicTypes.IIncreaseExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.increaseExpectedAmountRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.
   *
   * @param deltaAmount Amount by which to reduce the expected amount
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param paymentInformation Payment information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async reduceExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.Amount,
    signerIdentity: IdentityTypes.IIdentity,
    paymentInformation?: any,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];
    if (paymentInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add payment information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddPaymentInformation(paymentInformation),
      );
    }

    const parameters: RequestLogicTypes.IReduceExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.reduceExpectedAmountRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Adds payment information
   *
   * @param paymentInformation Payment information to add (any because it is specific to the payment network used by the request)
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async addPaymentInformation(
    paymentInformation: any,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot add payment information without payment network');
    }

    extensionsData.push(
      this.paymentNetwork.createExtensionsDataForAddPaymentInformation(paymentInformation),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Adds refund information
   *
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async addRefundInformation(
    refundInformation: any,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot add refund information without payment network');
    }

    extensionsData.push(
      this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Declare a payment is sent for the declarative payment network
   *
   * @param amount Amount sent
   * @param note Note from payer about the sent payment
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareSentPayment(
    amount: string,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare sent payment without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareSentPayment
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareSentPayment) {
      throw new Error('Cannot declare sent payment without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareSentPayment({ amount, note }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Declare a refund is sent for the declarative payment network
   *
   * @param amount Amount sent
   * @param note Note from payee about the sent refund
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareSentRefund(
    amount: string,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare sent refund without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareSentRefund
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareSentRefund) {
      throw new Error('Cannot declare sent refund without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareSentRefund({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Declare a payment is received for the declarative payment network
   *
   * @param amount Amount received
   * @param note Note from payee about the received payment
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareReceivedPayment(
    amount: string,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare received payment without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareReceivedPayment
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareReceivedPayment) {
      throw new Error('Cannot declare received payment without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareReceivedPayment({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Declare a refund is received for the declarative payment network
   *
   * @param amount Amount received
   * @param note Note from payer about the received refund
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareReceivedRefund(
    amount: string,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestData> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare received refund without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareReceivedRefund
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareReceivedRefund) {
      throw new Error('Cannot declare received refund without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareReceivedRefund({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    try {
      await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity, true);
    } catch (error) {
      throw new Error(`${error.message} (maybe transactions are still pending)`);
    }

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Gets the request data
   *
   * @returns The updated request data
   */
  public getData(): Types.IRequestData {
    const requestData: RequestLogicTypes.IRequest = Utils.deepCopy(this.requestData);

    let currency: string;
    let currencyInfo: RequestLogicTypes.ICurrency;
    if (requestData) {
      currency = requestData.currency ? currencyToString(requestData.currency) : 'unknown';
      currencyInfo = requestData.currency;
    } else {
      const pendingData: RequestLogicTypes.IRequest = Utils.deepCopy(this.pendingData);
      currency = pendingData.currency ? currencyToString(pendingData.currency) : 'unknown';
      currencyInfo = pendingData.currency;
    }

    return {
      ...requestData,
      balance: this.balance,
      contentData: this.contentData,
      currency,
      currencyInfo,
      meta: this.requestMeta,
      pending: this.pendingData,
    };
  }

  /**
   * Refresh the request data and balance from the network (check if new events happened - e.g: accept, payments etc..) and return these data
   *
   * @returns Refreshed request data
   */
  public async refresh(): Promise<Types.IRequestData> {
    const requestAndMeta: RequestLogicTypes.IReturnGetRequestFromId = await this.requestLogic.getRequestFromId(
      this.requestId,
    );

    if (!requestAndMeta.result.request && !requestAndMeta.result.pending) {
      throw new Error(
        `No request found for the id: ${this.requestId} - ${localUtils.formatGetRequestFromIdError(
          requestAndMeta,
        )}`,
      );
    }
    if (this.paymentNetwork) {
      // TODO: PROT-1131 - add a pending balance
      this.balance = await this.paymentNetwork.getBalance(
        requestAndMeta.result.request || requestAndMeta.result.pending,
      );
    }

    if (this.contentDataExtension) {
      // TODO: PROT-1131 - add a pending content
      this.contentData = await this.contentDataExtension.getContent(
        requestAndMeta.result.request || requestAndMeta.result.pending,
      );
    }

    this.requestData = requestAndMeta.result.request;
    this.pendingData = requestAndMeta.result.pending;
    this.requestMeta = requestAndMeta.meta;

    return this.getData();
  }
}
