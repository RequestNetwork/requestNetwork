import { IDataAccess, RequestLogic as RequestLogicTypes } from '@requestnetwork/types';
import RequestLogicCore from './requestLogicCore';

export class RequestLogic implements RequestLogicTypes.IRequestLogic {
  private dataAccess: IDataAccess;
  public constructor(dataAccess: IDataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Function to create a request and persist it on the data-acess layer
   *
   * @param requestParameters IRequestLogicCreateParameters parameters to create a request
   * @param IRequestLogicSignatureParameters signatureParams Signature parameters
   *
   * @returns Types.IRequestLogicRequest the new request
   */
  public createRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCreateParameters,
    signatureParams: RequestLogicTypes.IRequestLogicSignatureParameters,
    indexes: string[] = [],
  ): string {
    const transaction = RequestLogicCore.formatCreate(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    // concat index given and the default index (requestId)
    indexes.push(requestId);
    return this.dataAccess.persist(JSON.stringify(transaction), indexes);
  }

  /**
   * Function to accept a request and persist it on the data-acess layer
   *
   * @param IRequestLogicAcceptParameters acceptParameters parameters to accept a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public acceptRequest(
    requestParameters: RequestLogicTypes.IRequestLogicAcceptParameters,
    signatureParams: RequestLogicTypes.IRequestLogicSignatureParameters,
  ): string {
    const transaction = RequestLogicCore.formatAccept(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persist(JSON.stringify(transaction), [requestId]);
  }

  /**
   * Function to cancel a request and persist it on the data-acess layer
   *
   * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public cancelRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCancelParameters,
    signatureParams: RequestLogicTypes.IRequestLogicSignatureParameters,
  ): string {
    const transaction = RequestLogicCore.formatCancel(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persist(JSON.stringify(transaction), [requestId]);
  }

  /**
   * Function to increase expected amount of a request and persist it on the data-acess layer
   *
   * @param IRequestLogicIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public increaseExpectecAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters,
    signatureParams: RequestLogicTypes.IRequestLogicSignatureParameters,
  ): string {
    const transaction = RequestLogicCore.formatIncreaseExpectedAmount(
      requestParameters,
      signatureParams,
    );
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persist(JSON.stringify(transaction), [requestId]);
  }

  /**
   * Function to reduce expected amount of a request and persist it on the data-acess layer
   *
   * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public reduceExpectecAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters,
    signatureParams: RequestLogicTypes.IRequestLogicSignatureParameters,
  ): string {
    const transaction = RequestLogicCore.formatReduceExpectedAmount(
      requestParameters,
      signatureParams,
    );
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persist(JSON.stringify(transaction), [requestId]);
  }

  /**
   * Function to get a request from its requestId from the transaction in the data-access layer
   *
   * @param RequestLogicRequestId requestId the requestId of the request to retrieve
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public getRequestById(
    requestId: RequestLogicTypes.RequestLogicRequestId,
  ): RequestLogicTypes.IRequestLogicRequest | undefined {
    const transactions = this.dataAccess.get(requestId);

    // second parameter is null, because the first transaction must be a creation (no state expected)
    return transactions.reduce(RequestLogicCore.applyTransactionToRequest, null);
  }
}
