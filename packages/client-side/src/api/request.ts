import {
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
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
   * @param ISignatureParameters signatureParams Signature parameters
   * @param any[] extensionsData
   * @returns Promise<Request>
   */
  public async accept(
    signatureParams: SignatureTypes.ISignatureParameters,
    extensionsData: any[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const parameters: RequestLogicTypes.IRequestLogicAcceptParameters = {
      extensionsData,
      requestId: this.requestId,
    };
    const { meta } = await this.requestLogic.acceptRequest(parameters, signatureParams);
    return { request: this, meta };
  }

  /**
   * Cancel a request
   *
   */
  public cancel(): void {
    return;
  }

  /**
   * Increases the expected amount of the request
   */
  public increaseExpectedAmountRequest(): void {
    return;
  }

  /**
   * Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.
   */
  public reduceExpectedAmountRequest(): void {
    return;
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
    return;
  }

  /**
   * Refunds a request
   */
  public refund(): void {
    return;
  }

  /**
   * Gets the events of the Request
   */
  public getHistory(): void {
    return;
  }
}
