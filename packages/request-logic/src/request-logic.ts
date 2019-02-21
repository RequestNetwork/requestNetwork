import {
  AdvancedLogic as AdvancedLogicTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestLogicCore from './requestLogicCore';

/**
 * Implementation of Request Logic
 */
export default class RequestLogic implements RequestLogicTypes.IRequestLogic {
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic | undefined;
  private transactionManager: TransactionTypes.ITransactionManager;
  private signatureProvider: SignatureProviderTypes.ISignatureProvider | undefined;

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
   * @param requestParameters ICreateParameters parameters to create a request
   * @param IIdentity signerIdentity Identity of the signer
   * @param string[] topics list of string to topic the request
   *
   * @returns Promise<IRequestLogicReturnCreateRequest>  the request id and the meta data
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    indexes: string[] = [],
  ): Promise<RequestLogicTypes.IReturnCreateRequest> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = await RequestLogicCore.formatCreate(
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
   * @param IAcceptParameters acceptParameters parameters to accept a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async acceptRequest(
    requestParameters: RequestLogicTypes.IAcceptParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = await RequestLogicCore.formatAccept(
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
   * @param ICancelParameters cancelParameters parameters to cancel a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async cancelRequest(
    requestParameters: RequestLogicTypes.ICancelParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = await RequestLogicCore.formatCancel(
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
   * @param IIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async increaseExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IIncreaseExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = await RequestLogicCore.formatIncreaseExpectedAmount(
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
   * @param IReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async reduceExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IReduceExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }
    const action = await RequestLogicCore.formatReduceExpectedAmount(
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
   * @param IAddExtensionsDataParameters requestParameters parameters to add extensions Data to a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async addExtensionsDataRequest(
    requestParameters: RequestLogicTypes.IAddExtensionsDataParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.IRequestLogicReturn> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = await RequestLogicCore.formatAddExtensionsData(
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
   * @param requestId the requestId of the request to retrieve
   *
   * @returns the request constructed from the actions
   */
  public async getRequestById(
    requestId: RequestLogicTypes.RequestId,
  ): Promise<RequestLogicTypes.IReturnGetRequestById> {
    const resultGetTx = await this.transactionManager.getTransactionsByTopic(requestId);
    const actions = resultGetTx.result.transactions;

    try {
      // array of transaction without duplicates to avoid replay attack
      const transactionsWithoutDuplicates = Utils.unique(
        actions.map((t: any) => JSON.parse(t.data)),
      );

      // second parameter is null, because the first action must be a creation (no state expected)
      const request = transactionsWithoutDuplicates.uniqueItems.reduce(
        (requestState: any, action: any) =>
          RequestLogicCore.applyActionToRequest(requestState, action, this.advancedLogic),
        null,
      );

      return {
        meta: {
          ignoredTransactions: transactionsWithoutDuplicates.duplicates,
          transactionManagerMeta: resultGetTx.meta,
        },
        result: { request },
      };
    } catch (e) {
      // Error parsing the actions
      throw e;
    }
  }
}
