import {
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

import Request from './request';

/**
 * Entry point to create requests.
 *
 * @class RequestNetwork
 */
export default class RequestNetwork {
  private requestLogic: RequestLogicTypes.IRequestLogic;

  public constructor(requestLogic: RequestLogicTypes.IRequestLogic) {
    this.requestLogic = requestLogic;
  }

  /**
   * Creates a request.
   *
   * @param requestParameters IRequestLogicCreateParameters parameters to create a request
   * @param ISignatureParameters signatureParams Signature parameters
   * @memberof RequestNetwork
   * @returns Promise<Request> the request
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCreateParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
    indexes: string[] = [],
  ): Promise<{ request: Request; meta: RequestLogicTypes.IRequestLogicReturnMeta }> {
    const {
      result: { requestId },
      meta,
    } = await this.requestLogic.createRequest(requestParameters, signatureParams, indexes);
    return { request: new Request(this.requestLogic, requestId), meta };
  }

  /**
   * Create a Request instance from an existing Request's ID
   *
   * @param {RequestLogicTypes.RequestLogicRequestId} requestId The ID of the Request
   * @returns {Request} the Request
   * @memberof RequestNetwork
   */
  public fromRequestId(requestId: RequestLogicTypes.RequestLogicRequestId): Request {
    return new Request(this.requestLogic, requestId);
  }
}
