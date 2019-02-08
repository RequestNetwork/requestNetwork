import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import * as Types from '../types';

/**
 * Class representing a request.
 * Instances of this class can be accepted, paid, refunded, etc.
 * Use the member function `getData` to access the properties of the Request.
 *
 * Requests should be created with `RequestNetwork.createRequest()`.
 *
 * @class Request
 */
export default class Request {
  /**
   * Unique ID of the request
   *
   * @type {RequestLogicTypes.RequestLogicRequestId}
   */
  public readonly requestId: RequestLogicTypes.RequestLogicRequestId;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private paymentNetwork: Types.IPaymentNetworkManager | null = null;
  /**
   * Data of the request (see request-logic)
   *
   * @private
   * @type {(RequestLogicTypes.IRequestLogicRequest | null)}
   * @memberof Request
   */
  private requestData: RequestLogicTypes.IRequestLogicRequest | null = null;
  /**
   * Meta data of the request (e.g: from where the data have been retrieved)
   *
   * @private
   * @type {(RequestLogicTypes.IRequestLogicReturnMeta | null)}
   * @memberof Request
   */
  private requestMeta: RequestLogicTypes.IRequestLogicReturnMeta | null = null;
  /**
   * Balance and payments/refund events
   *
   * @private
   * @type {(Types.IBalanceWithEvents | null)}
   * @memberof Request
   */
  private balance: Types.IBalanceWithEvents | null = null;

  /**
   * Creates an instance of Request
   *
   * @param {RequestLogicTypes.IRequestLogic} requestLogic
   * @param {RequestLogicTypes.RequestLogicRequestId} requestId ID of the Request
   */
  constructor(
    requestLogic: RequestLogicTypes.IRequestLogic,
    requestId: RequestLogicTypes.RequestLogicRequestId,
    paymentNetwork?: Types.IPaymentNetworkManager | null,
  ) {
    this.requestLogic = requestLogic;
    this.requestId = requestId;
    this.paymentNetwork = paymentNetwork || null;
  }

  /**
   * Accepts a request
   *
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {*} [refundInformation] refund information to add (any because it is specific to the payment network used by the request)
   * @returns Promise<Request>
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
    const parameters: RequestLogicTypes.IRequestLogicAcceptParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    await this.requestLogic.acceptRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Cancels a request
   *
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {*} [refundInformation] refund information to add (any because it is specific to the payment network used by the request)
   * @returns Promise<Request>
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

    const parameters: RequestLogicTypes.IRequestLogicCancelParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    await this.requestLogic.cancelRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Increases the expected amount of the request.
   *
   * @param {RequestLogicTypes.RequestLogicAmount} deltaAmount Amount by which to increase the expected amount
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {*} [refundInformation] refund information to add (any because it is specific to the payment network used by the request)
   * @returns {Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }>}
   * @memberof Request
   */
  public async increaseExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.RequestLogicAmount,
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
    const parameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };
    await this.requestLogic.increaseExpectedAmountRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.
   *
   * @param {RequestLogicTypes.RequestLogicAmount} deltaAmount Amount by which to reduce the expected amount
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {*} [paymentInformation] payment information to add (any because it is specific to the payment network used by the request)
   * @returns {Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }>}
   * @memberof Request
   */
  public async reduceExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.RequestLogicAmount,
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

    const parameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };

    await this.requestLogic.reduceExpectedAmountRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Add Payment information
   *
   * @param {*} paymentInformation payment information to add (any because it is specific to the payment network used by the request)
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns {Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }>}
   * @memberof Request
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

    const parameters: RequestLogicTypes.IRequestLogicAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };
    await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Add Refund information
   *
   * @param {*} refundInformation refund information to add (any because it is specific to the payment network used by the request)
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns {Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }>}
   * @memberof Request
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

    const parameters: RequestLogicTypes.IRequestLogicAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };
    await this.requestLogic.addExtensionsDataRequest(parameters, signerIdentity);

    // refresh the local request data and return it
    return this.refresh();
  }

  /**
   * Gets the request data
   *
   * @returns {Types.IRequestData}
   * @memberof Request
   */
  public getData(): Types.IRequestData {
    return { requestInfo: this.requestData, meta: this.requestMeta, balance: this.balance };
  }

  /**
   * Refresh the request data and balance from the network (check if new events happened - e.g: accept, payments etc..) and return these data
   *
   * @returns {Promise<Types.IRequestData>} Refreshed request data
   * @memberof Request
   */
  public async refresh(): Promise<Types.IRequestData> {
    const requestAndMeta: RequestLogicTypes.IRequestLogicReturnGetRequestById = await this.requestLogic.getRequestById(
      this.requestId,
    );

    if (!requestAndMeta.result.request) {
      throw new Error(`No request found for the id: ${this.requestId}`);
    }

    if (this.paymentNetwork) {
      this.balance = await this.paymentNetwork.getBalance(requestAndMeta.result.request);
    }

    this.requestData = requestAndMeta.result.request;
    this.requestMeta = requestAndMeta.meta;

    return this.getData();
  }

  /**
   * Pays a request
   */
  public pay(): void {
    // Not implemented yet
    return;
  }

  /**
   * Refunds a request
   */
  public refund(): void {
    // Not implemented yet
    return;
  }

  /**
   * Gets the events of the Request
   */
  public getHistory(): void {
    // Not implemented yet
    return;
  }
}
