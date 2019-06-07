import {
  AdvancedLogicTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  TransactionTypes,
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

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      requestId,
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
      requestId,
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
      requestId,
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
      requestId,
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
      requestId,
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
      requestId,
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
    };
  }

  /**
   * Function to get a request from the request id from the actions in the data-access layer
   *
   * @param requestId the requestId of the request to retrieve
   *
   * @returns the request constructed from the actions
   */
  public async getRequestFromId(requestId: string): Promise<RequestLogicTypes.IReturnGetRequestFromId> {
    const resultGetTx = await this.transactionManager.getTransactionsByChannelId(requestId);
    const actions = resultGetTx.result.transactions;
    let ignoredTransactions: any[] = [];

    // array of transaction without duplicates to avoid replay attack
    const actionsConfirmedWithoutDuplicates = Utils.uniqueByProperty(
      actions
        .map((t: any) => {
          try {
            return { action: JSON.parse(t.transaction.data), timestamp: t.timestamp };
          } catch (e) {
            // We ignore the transaction.data that cannot be parsed
            ignoredTransactions.push({
              reason: 'JSON parsing error',
              transaction: t,
            });
            return;
          }
        })
        .filter((elem: any) => elem !== undefined),
      'action',
    );
    // Keeps the transaction ignored
    ignoredTransactions = ignoredTransactions.concat(
      actionsConfirmedWithoutDuplicates.duplicates.map(tx => {
        return {
          reason: 'Duplicated transaction',
          transaction: tx,
        };
      }),
    );

    // second parameter is null, because the first action must be a creation (no state expected)
    const request = actionsConfirmedWithoutDuplicates.uniqueItems.reduce(
      (requestState: any, actionConfirmed: any) => {
        try {
          return RequestLogicCore.applyActionToRequest(
            requestState,
            actionConfirmed.action,
            actionConfirmed.timestamp,
            this.advancedLogic,
          );
        } catch (e) {
          // if an error occurs during the apply we ignore the action
          ignoredTransactions.push({ reason: e.message, transaction: actionConfirmed });
          return requestState;
        }
      },
      null,
    );

    return {
      meta: {
        ignoredTransactions,
        transactionManagerMeta: resultGetTx.meta,
      },
      result: { request },
    };
  }

  /**
   * Gets the requests indexed by a topic from the actions in the data-access layer
   *
   * @param topic
   * @returns all the requests indexed by topic
   */
  public async getRequestsByTopic(
    topic: string,
    updatedBetween?: RequestLogicTypes.ITimestampBoundaries,
  ): Promise<RequestLogicTypes.IReturnGetRequestsByTopic> {
    const getChannelsResult = await this.transactionManager.getChannelsByTopic(
      topic,
      updatedBetween,
    );
    const transactionsByChannel = getChannelsResult.result.transactions;
    const transactionManagerMeta = getChannelsResult.meta.dataAccessMeta;

    // Gets all the requests from the transactions
    const allRequestAndMeta = Object.keys(getChannelsResult.result.transactions).map(channelId => {
      // Parses and removes corrupted or duplicated transactions

      let ignoredTransactions: any[] = [];

      const actionsConfirmedWithoutDuplicates = Utils.uniqueByProperty(
        transactionsByChannel[channelId]
          .map((t: any) => {
            try {
              return { action: JSON.parse(t.transaction.data), timestamp: t.timestamp };
            } catch (e) {
              // We ignore the transaction.data that cannot be parsed
              ignoredTransactions.push({
                reason: 'JSON parsing error',
                transaction: t,
              });
              return;
            }
          })
          .filter((elem: any) => elem !== undefined),
        'action',
      );

      // Keeps the transaction ignored
      ignoredTransactions = ignoredTransactions.concat(
        actionsConfirmedWithoutDuplicates.duplicates.map(tx => ({
          reason: 'Duplicated transaction',
          transaction: tx,
        })),
      );

      // second parameter is null, because the first action must be a creation (no state expected)
      const request = actionsConfirmedWithoutDuplicates.uniqueItems.reduce(
        (requestState: any, actionConfirmed: any) => {
          try {
            return RequestLogicCore.applyActionToRequest(
              requestState,
              actionConfirmed.action,
              actionConfirmed.timestamp,
              this.advancedLogic,
            );
          } catch (e) {
            // if an error occurs during the apply we ignore the action
            ignoredTransactions.push({ reason: e.message, transaction: actionConfirmed });
            return requestState;
          }
        },
        null,
      );

      return {
        ignoredTransactions,
        request,
        transactionManagerMeta: transactionManagerMeta[channelId],
      };
    });

    // Merge all the requests and meta in one object
    return allRequestAndMeta.reduce(
      (finalResult: RequestLogicTypes.IReturnGetRequestsByTopic, requestAndMeta: any) => {
        if (requestAndMeta.request) {
          finalResult.result.requests.push(requestAndMeta.request);

          // workaround to quiet the error "finalResult.meta.ignoredTransactions can be undefined" (but defined in the initialization value of the accumulator)
          (finalResult.meta.ignoredTransactions || []).push(requestAndMeta.ignoredTransactions);

          // add the transactionManagerMeta
          (finalResult.meta.transactionManagerMeta || []).push(
            requestAndMeta.transactionManagerMeta,
          );
        }

        return finalResult;
      },
      {
        meta: {
          ignoredTransactions: [],
          transactionManagerMeta: [],
        },
        result: { requests: [] },
      },
    );
  }
}
