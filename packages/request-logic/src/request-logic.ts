import {
  AdvancedLogic as AdvancedLogicTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import RequestLogicCore from './requestLogicCore';

/**
 * Implementation of Request Logic
 */
export default class RequestLogic implements RequestLogicTypes.IRequestLogic {
  private transactionManager: TransactionTypes.ITransactionManager;
  private signatureProvider: SignatureProviderTypes.ISignatureProvider | undefined;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic | undefined;

  public constructor(
    transactionManager: TransactionTypes.ITransactionManager,
    signatureProvider?: SignatureProviderTypes.ISignatureProvider,
    advancedLogic?: AdvancedLogicTypes.IAdvancedLogic,
  ) {
    this.transactionManager = transactionManager;
    this.signatureProvider = signatureProvider;
    this.advancedLogic = advancedLogic;
  }

  /**
   * Function to create a request and persist it on the transaction manager layer
   *
   * @param requestParameters IRequestLogicCreateParameters parameters to create a request
   * @param IIdentity signerIdentity Identity of the signer
   * @param string[] topics list of string to topic the request
   *
   * @returns Promise<IRequestLogicReturnCreateRequest>  the request id and the meta data
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    indexes: string[] = [],
  ): Promise<RequestLogicTypes.IRequestLogicReturnCreateRequest> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = RequestLogicCore.formatCreate(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    // concat index given and the default index (requestId)
    indexes = [...indexes, requestId];

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      indexes,
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
      result: { requestId },
    };
  }

  /**
   * Function to accept a request and persist it on through the transaction manager layer
   *
   * @param IRequestLogicAcceptParameters acceptParameters parameters to accept a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async acceptRequest(
    requestParameters: RequestLogicTypes.IRequestLogicAcceptParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = RequestLogicCore.formatAccept(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      [requestId],
    );

    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to cancel a request and persist it on through the transaction manager layer
   *
   * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async cancelRequest(
    requestParameters: RequestLogicTypes.IRequestLogicCancelParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = RequestLogicCore.formatCancel(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      [requestId],
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to increase expected amount of a request and persist it on through the transaction manager layer
   *
   * @param IRequestLogicIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async increaseExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicIncreaseExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = RequestLogicCore.formatIncreaseExpectedAmount(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      [requestId],
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to reduce expected amount of a request and persist it on through the transaction manager layer
   *
   * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async reduceExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IRequestLogicReduceExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = RequestLogicCore.formatReduceExpectedAmount(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      [requestId],
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to add extensions data to a request and persist it through the transaction manager layer
   *
   * @param IRequestLogicAddExtensionsDataParameters requestParameters parameters to add extensions Data to a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async addExtensionsDataRequest(
    requestParameters: RequestLogicTypes.IRequestLogicAddExtensionsDataParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = RequestLogicCore.formatAddExtensionsData(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      [requestId],
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
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
    const resultGetTx = await this.transactionManager.getTransactionsByTopic(requestId);
    const actions = resultGetTx.result.transactions;

    try {
      // second parameter is null, because the first action must be a creation (no state expected)
      const request: RequestLogicTypes.IRequestLogicRequest | null = actions
        .map((t: any) => JSON.parse(t.data))
        .reduce(
          (requestState, action) =>
            RequestLogicCore.applyActionToRequest(requestState, action, this.advancedLogic),
          null,
        );

      return {
        meta: { transactionManagerMeta: resultGetTx.meta },
        result: { request },
      };
    } catch (e) {
      // Error parsing the actions
      throw e;
    }
  }
}
