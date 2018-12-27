import {
  DataAccess as DataAccessTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import RequestLogicCore from './requestLogicCore';

/**
 * Implementation of Request Logic
 */
export default class RequestLogic implements RequestLogicTypes.IRequestLogic {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Function to create a request and persist it on the data-access layer
   *
   * @param requestParameters IRequestLogicCreateParameters parameters to create a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Promise<string>  the storage location of the transaction
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCreateParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
    indexes: string[] = [],
  ): Promise<RequestLogicTypes.IRequestLogicReturnCreateRequest> {
    const action = RequestLogicCore.formatCreate(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    // concat index given and the default index (requestId)
    indexes = [...indexes, requestId];

    const resultPersistTx = await this.dataAccess.persistTransaction(
      JSON.stringify(action),
      signatureParams,
      indexes,
    );
    return {
      meta: { dataAccessMeta: resultPersistTx.meta },
      result: { requestId },
    };
  }

  /**
   * Function to accept a request and persist it on the data-access layer
   *
   * @param IRequestLogicAcceptParameters acceptParameters parameters to accept a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Promise<string>  the storage location of the transaction
   */
  public async acceptRequest(
    requestParameters: RequestLogicTypes.IRequestLogicAcceptParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    const action = RequestLogicCore.formatAccept(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.dataAccess.persistTransaction(
      JSON.stringify(action),
      signatureParams,
      [requestId],
    );

    return {
      meta: { dataAccessMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to cancel a request and persist it on the data-access layer
   *
   * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Promise<string>  the storage location of the transaction
   */
  public async cancelRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCancelParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    const action = RequestLogicCore.formatCancel(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.dataAccess.persistTransaction(
      JSON.stringify(action),
      signatureParams,
      [requestId],
    );
    return {
      meta: { dataAccessMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to increase expected amount of a request and persist it on the data-access layer
   *
   * @param IRequestLogicIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Promise<string>  the storage location of the transaction
   */
  public async increaseExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    const action = RequestLogicCore.formatIncreaseExpectedAmount(
      requestParameters,
      signatureParams,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.dataAccess.persistTransaction(
      JSON.stringify(action),
      signatureParams,
      [requestId],
    );
    return {
      meta: { dataAccessMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to reduce expected amount of a request and persist it on the data-access layer
   *
   * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Promise<string>  the storage location of the transaction
   */
  public async reduceExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    const action = RequestLogicCore.formatReduceExpectedAmount(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.dataAccess.persistTransaction(
      JSON.stringify(action),
      signatureParams,
      [requestId],
    );
    return {
      meta: { dataAccessMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to get a request from its requestId from the action in the data-access layer
   *
   * @param RequestLogicRequestId requestId the requestId of the request to retrieve
   *
   * @returns Promise<RequestLogicTypes.IRequestLogicRequest | null> the request constructed from the actions
   */
  public async getRequestById(
    requestId: RequestLogicTypes.RequestLogicRequestId,
  ): Promise<RequestLogicTypes.IRequestLogicReturnGetRequestById> {
    const resultGetTx = await this.dataAccess.getTransactionsByTopic(requestId);
    const actions = resultGetTx.result.transactions;

    try {
      // second parameter is null, because the first action must be a creation (no state expected)
      const request: RequestLogicTypes.IRequestLogicRequest | null = actions
        .map((t: any) => JSON.parse(t.data))
        .reduce(RequestLogicCore.applyActionToRequest, null);

      return {
        meta: { dataAccessMeta: resultGetTx.meta },
        result: { request },
      };
    } catch (e) {
      // Error parsing the actions
      throw e;
    }
  }
}
