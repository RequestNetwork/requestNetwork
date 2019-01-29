import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

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

  /**
   * Creates an instance of Request
   *
   * @param {RequestLogicTypes.IRequestLogic} requestLogic
   * @param {RequestLogicTypes.RequestLogicRequestId} requestId ID of the Request
   */
  constructor(
    requestLogic: RequestLogicTypes.IRequestLogic,
    requestId: RequestLogicTypes.RequestLogicRequestId,
  ) {
    this.requestLogic = requestLogic;
    this.requestId = requestId;
  }

  /**
   * Accepts a request
   *
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {any[]} [extensionsData=[]]
   * @returns Promise<Request>
   */
  public async accept(
    signerIdentity: IdentityTypes.IIdentity,
    extensionsData: any[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const parameters: RequestLogicTypes.IRequestLogicAcceptParameters = {
      extensionsData,
      requestId: this.requestId,
    };
    const { meta } = await this.requestLogic.acceptRequest(parameters, signerIdentity);
    return { request: this, meta };
  }

  /**
   * Cancels a request
   *
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {any[]} [extensionsData=[]]
   * @returns Promise<Request>
   */
  public async cancel(
    signerIdentity: IdentityTypes.IIdentity,
    extensionsData: any[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const parameters: RequestLogicTypes.IRequestLogicCancelParameters = {
      extensionsData,
      requestId: this.requestId,
    };
    const { meta } = await this.requestLogic.cancelRequest(parameters, signerIdentity);
    return { request: this, meta };
  }

  /**
   * Increases the expected amount of the request.
   *
   * @param {RequestLogicTypes.RequestLogicAmount} deltaAmount Amount by which to increase the expected amount
   * @param {IdentityTypes.IIdentity} signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param {any[]} [extensionsData=[]]
   * @returns {Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }>}
   * @memberof Request
   */
  public async increaseExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.RequestLogicAmount,
    signerIdentity: IdentityTypes.IIdentity,
    extensionsData: any[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const parameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };
    const { meta } = await this.requestLogic.increaseExpectedAmountRequest(
      parameters,
      signerIdentity,
    );
    return { request: this, meta };
  }

  /**
   * Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.
   */
  public async reduceExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.RequestLogicAmount,
    signerIdentity: IdentityTypes.IIdentity,
    extensionsData: any[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const parameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };
    const { meta } = await this.requestLogic.reduceExpectedAmountRequest(
      parameters,
      signerIdentity,
    );
    return { request: this, meta };
  }

  /**
   * Gets the data of a request
   * Use this method to get fresh data from the blockchain
   *
   * @returns {Promise<any>} Promise resolving to the data of the request
   */
  public async getData(): Promise<any> {
    return this.requestLogic.getRequestById(this.requestId);
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
