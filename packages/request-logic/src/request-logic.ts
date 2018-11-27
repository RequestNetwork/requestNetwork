import {
  DataAccess as DataAccessTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import RequestLogicCore from './requestLogicCore';

export default class RequestLogic implements RequestLogicTypes.IRequestLogic {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Function to create a request and persist it on the data-acess layer
   *
   * @param requestParameters IRequestLogicCreateParameters parameters to create a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns Types.IRequestLogicRequest the new request
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCreateParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
    indexes: string[] = [],
  ): Promise<string> {
    const transaction = RequestLogicCore.formatCreate(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    // concat index given and the default index (requestId)
    indexes.push(requestId);
    return this.dataAccess.persistTransaction(
      JSON.stringify(transaction),
      signatureParams,
      indexes,
    );
  }

  /**
   * Function to accept a request and persist it on the data-acess layer
   *
   * @param IRequestLogicAcceptParameters acceptParameters parameters to accept a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public async acceptRequest(
    requestParameters: RequestLogicTypes.IRequestLogicAcceptParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<string> {
    const transaction = RequestLogicCore.formatAccept(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persistTransaction(JSON.stringify(transaction), signatureParams, [
      requestId,
    ]);
  }

  /**
   * Function to cancel a request and persist it on the data-acess layer
   *
   * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public async cancelRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCancelParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<string> {
    const transaction = RequestLogicCore.formatCancel(requestParameters, signatureParams);
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persistTransaction(JSON.stringify(transaction), signatureParams, [
      requestId,
    ]);
  }

  /**
   * Function to increase expected amount of a request and persist it on the data-acess layer
   *
   * @param IRequestLogicIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public async increaseExpectecAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<string> {
    const transaction = RequestLogicCore.formatIncreaseExpectedAmount(
      requestParameters,
      signatureParams,
    );
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persistTransaction(JSON.stringify(transaction), signatureParams, [
      requestId,
    ]);
  }

  /**
   * Function to reduce expected amount of a request and persist it on the data-acess layer
   *
   * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
   * @param ISignatureParameters signatureParams Signature parameters
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public async reduceExpectecAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters,
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<string> {
    const transaction = RequestLogicCore.formatReduceExpectedAmount(
      requestParameters,
      signatureParams,
    );
    const requestId = RequestLogicCore.getRequestIdFromTransaction(transaction);

    return this.dataAccess.persistTransaction(JSON.stringify(transaction), signatureParams, [
      requestId,
    ]);
  }

  /**
   * Function to get a request from its requestId from the transaction in the data-access layer
   *
   * @param RequestLogicRequestId requestId the requestId of the request to retrieve
   *
   * @returns IRequestLogicTransaction  the transaction with the signature
   */
  public async getRequestById(
    requestId: RequestLogicTypes.RequestLogicRequestId,
  ): Promise<RequestLogicTypes.IRequestLogicRequest | undefined> {
    const transactions = await this.dataAccess.getTransactionsByIndex(requestId);
    try {
      // second parameter is null, because the first transaction must be a creation (no state expected)
      return transactions
        .map(t => JSON.parse(t))
        .reduce(RequestLogicCore.applyTransactionToRequest, null);
    } catch (e) {
      throw new Error('Impossible to parse the transactions');
    }
  }
}
