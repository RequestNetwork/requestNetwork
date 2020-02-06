import MultiFormat from '@requestnetwork/multi-format';
import {
  AdvancedLogicTypes,
  EncryptionTypes,
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
   * Creates a request and persists it on the transaction manager layer
   *
   * @param ICreateParameters parameters to create a request
   * @param signerIdentity Identity of the signer
   * @param topics list of string to topic the request
   *
   * @returns the request id and the meta data
   */
  public async createRequest(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    topics: any[] = [],
  ): Promise<RequestLogicTypes.IReturnCreateRequest> {
    const { action, requestId, hashedTopics } = await this.createCreationActionRequestIdAndTopics(
      requestParameters,
      signerIdentity,
      topics,
    );

    // Validate the action, the apply will throw in case of error
    RequestLogicCore.applyActionToRequest(null, action, Date.now(), this.advancedLogic);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      requestId,
      hashedTopics,
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
      result: { requestId },
    };
  }

  /**
   * Creates an encrypted request and persists it on the transaction manager layer
   *
   * @param requestParameters parameters to create a request
   * @param signerIdentity Identity of the signer
   * @param encryptionParams list of encryption parameters to encrypt the channel key with
   * @param topics list of string to topic the request
   *
   * @returns the request id and the meta data
   */
  public async createEncryptedRequest(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    encryptionParams: EncryptionTypes.IEncryptionParameters[],
    topics: any[] = [],
  ): Promise<RequestLogicTypes.IReturnCreateRequest> {
    if (encryptionParams.length === 0) {
      throw new Error(
        'You must give at least one encryption parameter to create an encrypted request',
      );
    }

    const { action, requestId, hashedTopics } = await this.createCreationActionRequestIdAndTopics(
      requestParameters,
      signerIdentity,
      topics,
    );

    // Validate the action, the apply will throw in case of error
    RequestLogicCore.applyActionToRequest(null, action, Date.now(), this.advancedLogic);

    const resultPersistTx = await this.transactionManager.persistTransaction(
      JSON.stringify(action),
      requestId,
      hashedTopics,
      encryptionParams,
    );
    return {
      meta: { transactionManagerMeta: resultPersistTx.meta },
      result: { requestId },
    };
  }

  /**
   * Function to compute the id of a request without creating it
   *
   * @param requestParameters ICreateParameters parameters to create a request
   * @param IIdentity signerIdentity Identity of the signer
   *
   * @returns Promise<RequestLogicTypes.RequestId> the request id
   */
  public async computeRequestId(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<RequestLogicTypes.RequestId> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = await RequestLogicCore.formatCreate(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );

    // Validate the action, the apply will throw in case of error
    RequestLogicCore.applyActionToRequest(null, action, Date.now(), this.advancedLogic);

    return RequestLogicCore.getRequestIdFromAction(action);
  }

  /**
   * Function to accept a request   it on through the transaction manager layer
   *
   * @param IAcceptParameters acceptParameters parameters to accept a request
   * @param IIdentity signerIdentity Identity of the signer
   * @param boolean validate specifies if a validation should be done before persisting the transaction. Requires a full load of the Request.
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async acceptRequest(
    requestParameters: RequestLogicTypes.IAcceptParameters,
    signerIdentity: IdentityTypes.IIdentity,
    validate: boolean = false,
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
    if (validate) {
      await this.validateAction(requestId, action);
    }

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
   * @param boolean validate specifies if a validation should be done before persisting the transaction. Requires a full load of the Request.
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async cancelRequest(
    requestParameters: RequestLogicTypes.ICancelParameters,
    signerIdentity: IdentityTypes.IIdentity,
    validate: boolean = false,
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
    if (validate) {
      await this.validateAction(requestId, action);
    }

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
   * @param boolean validate specifies if a validation should be done before persisting the transaction. Requires a full load of the Request.
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async increaseExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IIncreaseExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
    validate: boolean = false,
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
    if (validate) {
      await this.validateAction(requestId, action);
    }

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
   * @param boolean validate specifies if a validation should be done before persisting the transaction. Requires a full load of the Request.
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async reduceExpectedAmountRequest(
    requestParameters: RequestLogicTypes.IReduceExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
    validate: boolean = false,
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
    if (validate) {
      await this.validateAction(requestId, action);
    }

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
   * @param boolean validate specifies if a validation should be done before persisting the transaction. Requires a full load of the Request.
   *
   * @returns Promise<IRequestLogicReturn> the meta data
   */
  public async addExtensionsDataRequest(
    requestParameters: RequestLogicTypes.IAddExtensionsDataParameters,
    signerIdentity: IdentityTypes.IIdentity,
    validate: boolean = false,
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
    if (validate) {
      await this.validateAction(requestId, action);
    }

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
  public async getRequestFromId(
    requestId: string,
  ): Promise<RequestLogicTypes.IReturnGetRequestFromId> {
    const {
      ignoredTransactions,
      requestStateConfirmed,
      requestStatePending,
      transactionManagerMeta,
    } = await this.computeRequestFromRequestId(requestId);

    const pending = this.computeDiffBetweenPendingAndConfirmedRequestState(
      requestStateConfirmed,
      requestStatePending,
    );

    return {
      meta: {
        ignoredTransactions,
        transactionManagerMeta,
      },
      result: { request: requestStateConfirmed, pending },
    };
  }

  /**
   * Gets the requests indexed by a topic from the transactions of transaction-manager layer
   *
   * @param topic
   * @returns all the requests indexed by topic
   */
  public async getRequestsByTopic(
    topic: string,
    updatedBetween?: RequestLogicTypes.ITimestampBoundaries,
  ): Promise<RequestLogicTypes.IReturnGetRequestsByTopic> {
    // hash all the topics
    const hashedTopic = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(topic));

    const getChannelsResult = await this.transactionManager.getChannelsByTopic(
      hashedTopic,
      updatedBetween,
    );
    return this.computeMultipleRequestFromChannels(getChannelsResult);
  }

  /**
   * Gets the requests indexed by multiple topics from the transactions of transaction-manager layer
   *
   * @param topics
   * @returns all the requests indexed by topics
   */
  public async getRequestsByMultipleTopics(
    topics: string[],
    updatedBetween?: RequestLogicTypes.ITimestampBoundaries,
  ): Promise<RequestLogicTypes.IReturnGetRequestsByTopic> {
    // hash all the topics
    const hashedTopics = topics.map(topic =>
      MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(topic)),
    );

    const getChannelsResult = await this.transactionManager.getChannelsByMultipleTopics(
      hashedTopics,
      updatedBetween,
    );
    return this.computeMultipleRequestFromChannels(getChannelsResult);
  }

  /**
   * Creates the creation action and the requestId of a request
   *
   * @param requestParameters parameters to create a request
   * @param signerIdentity Identity of the signer
   *
   * @returns the request id, the action and the hashed topics
   */
  private async createCreationActionRequestIdAndTopics(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    topics: any[],
  ): Promise<{
    action: RequestLogicTypes.IAction;
    hashedTopics: string[];
    requestId: RequestLogicTypes.RequestId;
  }> {
    if (!this.signatureProvider) {
      throw new Error('You must give a signature provider to create actions');
    }

    const action = await RequestLogicCore.formatCreate(
      requestParameters,
      signerIdentity,
      this.signatureProvider,
    );
    const requestId = RequestLogicCore.getRequestIdFromAction(action);

    // hash all the topics
    const hashedTopics = topics.map(topic =>
      MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(topic)),
    );

    return {
      action,
      hashedTopics,
      requestId,
    };
  }

  /**
   * Interprets a request from requestId
   *
   * @param requestId the requestId of the request to retrieve
   * @returns the request, the request pending and the ignoredTransactions
   */
  private async computeRequestFromRequestId(
    requestId: RequestLogicTypes.RequestId,
  ): Promise<{
    requestStateConfirmed: RequestLogicTypes.IRequest | null;
    requestStatePending: RequestLogicTypes.IRequest | null;
    ignoredTransactions: any[];
    transactionManagerMeta: any;
  }> {
    const resultGetTx = await this.transactionManager.getTransactionsByChannelId(requestId);
    const actions = resultGetTx.result.transactions
      // filter the actions ignored by the previous layers
      .filter(action => action !== null)
      .sort((a: any, b: any) => a.timestamp - b.timestamp);

    // tslint:disable-next-line:prefer-const
    let { ignoredTransactions, keptTransactions } = this.removeOldPendingTransactions(actions);

    // array of transaction without duplicates to avoid replay attack
    const timestampedActionsWithoutDuplicates = Utils.uniqueByProperty(
      keptTransactions
        .map((t: any) => {
          try {
            return {
              action: JSON.parse(t.transaction.data),
              state: t.state,
              timestamp: t.timestamp,
            };
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
      timestampedActionsWithoutDuplicates.duplicates.map(tx => {
        return {
          reason: 'Duplicated transaction',
          transaction: tx,
        };
      }),
    );

    const {
      requestStateConfirmed,
      requestStatePending,
      ignoredTransactionsByApplication,
    } = await this.computeRequestFromTransactions(timestampedActionsWithoutDuplicates.uniqueItems);
    ignoredTransactions = ignoredTransactions.concat(ignoredTransactionsByApplication);

    return {
      ignoredTransactions,
      requestStateConfirmed,
      requestStatePending,
      transactionManagerMeta: resultGetTx.meta,
    };
  }

  /**
   * Interprets a request from transactions
   *
   * @param transactions transactions to compute the request from
   * @returns the request and the ignoredTransactions
   */
  private async computeRequestFromTransactions(
    transactions: TransactionTypes.ITimestampedTransaction[],
  ): Promise<{
    requestStateConfirmed: RequestLogicTypes.IRequest | null;
    requestStatePending: RequestLogicTypes.IRequest | null;
    ignoredTransactionsByApplication: any[];
  }> {
    const ignoredTransactionsByApplication: any[] = [];
    // second parameter is null, because the first action must be a creation (no state expected)
    const requestStateConfirmed = transactions
      .filter(action => action.state === TransactionTypes.TransactionState.CONFIRMED)
      .reduce((requestState: any, actionConfirmed: any) => {
        try {
          return RequestLogicCore.applyActionToRequest(
            requestState,
            actionConfirmed.action,
            actionConfirmed.timestamp,
            this.advancedLogic,
          );
        } catch (e) {
          // if an error occurs while applying we ignore the action
          ignoredTransactionsByApplication.push({
            reason: e.message,
            transaction: actionConfirmed,
          });
          return requestState;
        }
      }, null);

    const requestStatePending = transactions
      .filter(action => action.state === TransactionTypes.TransactionState.PENDING)
      .reduce((requestState: any, actionConfirmed: any) => {
        try {
          return RequestLogicCore.applyActionToRequest(
            requestState,
            actionConfirmed.action,
            actionConfirmed.timestamp,
            this.advancedLogic,
          );
        } catch (e) {
          // if an error occurs while applying we ignore the action
          ignoredTransactionsByApplication.push({
            reason: e.message,
            transaction: actionConfirmed,
          });
          return requestState;
        }
      }, requestStateConfirmed);

    return {
      ignoredTransactionsByApplication,
      requestStateConfirmed,
      requestStatePending,
    };
  }

  /**
   * Interprets multiple requests from channels
   *
   * @param channelsRawData returned value by getChannels function
   * @returns the requests and meta data
   */
  private async computeMultipleRequestFromChannels(
    channelsRawData: TransactionTypes.IReturnGetTransactionsByChannels,
  ): Promise<RequestLogicTypes.IReturnGetRequestsByTopic> {
    const transactionsByChannel = channelsRawData.result.transactions;
    const transactionManagerMeta = channelsRawData.meta.dataAccessMeta;

    // Gets all the requests from the transactions
    const allRequestAndMetaPromises = Object.keys(channelsRawData.result.transactions).map(
      // Parses and removes corrupted or duplicated transactions
      async channelId => {
        // tslint:disable-next-line:prefer-const
        let { ignoredTransactions, keptTransactions } = this.removeOldPendingTransactions(
          transactionsByChannel[channelId],
        );

        const timestampedActionsWithoutDuplicates = Utils.uniqueByProperty(
          keptTransactions
            // filter the actions ignored by the previous layers
            .filter(action => action !== null)
            .map((t: any) => {
              try {
                return {
                  action: JSON.parse(t.transaction.data),
                  state: t.state,
                  timestamp: t.timestamp,
                };
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

        // Keeps the ignored transactions
        ignoredTransactions = ignoredTransactions.concat(
          timestampedActionsWithoutDuplicates.duplicates.map(tx => ({
            reason: 'Duplicated transaction',
            transaction: tx,
          })),
        );

        // Computes the request from the transactions
        const {
          requestStateConfirmed,
          requestStatePending,
          ignoredTransactionsByApplication,
        } = await this.computeRequestFromTransactions(
          timestampedActionsWithoutDuplicates.uniqueItems,
        );
        ignoredTransactions = ignoredTransactions.concat(ignoredTransactionsByApplication);

        const pending = this.computeDiffBetweenPendingAndConfirmedRequestState(
          requestStateConfirmed,
          requestStatePending,
        );

        return {
          ignoredTransactions,
          pending,
          request: requestStateConfirmed,
          transactionManagerMeta: transactionManagerMeta[channelId],
        };
      },
    );

    const allRequestAndMeta = await Promise.all(allRequestAndMetaPromises);

    // Merge all the requests and meta in one object
    return allRequestAndMeta.reduce(
      (finalResult: RequestLogicTypes.IReturnGetRequestsByTopic, requestAndMeta: any) => {
        if (requestAndMeta.request || requestAndMeta.pending) {
          finalResult.result.requests.push({
            pending: requestAndMeta.pending,
            request: requestAndMeta.request,
          });

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

  /**
   * Validates an action, throws if the action is invalid
   *
   * @param requestId the requestId of the request to retrieve
   * @param action the action to validate
   *
   * @returns void, throws if the action is invalid
   */
  private async validateAction(
    requestId: RequestLogicTypes.RequestId,
    action: RequestLogicTypes.IAction,
  ): Promise<void> {
    const { requestStateConfirmed, requestStatePending } = await this.computeRequestFromRequestId(
      requestId,
    );

    try {
      // Check if the action works with the request state
      RequestLogicCore.applyActionToRequest(
        requestStateConfirmed,
        action,
        Date.now(),
        this.advancedLogic,
      );
    } catch (error) {
      // Check if the action works with the pending state
      if (requestStatePending) {
        RequestLogicCore.applyActionToRequest(
          requestStatePending,
          action,
          Date.now(),
          this.advancedLogic,
        );
      }
    }
  }

  /**
   * Computes the diff between the confirmed and pending request
   *
   * @param requestStateConfirmed the confirmed request state
   * @param requestStatePending the pending request state
   * @returns an object with the pending state attributes that are different from the confirmed one
   */
  private computeDiffBetweenPendingAndConfirmedRequestState(
    requestStateConfirmed: any,
    requestStatePending: any,
  ): RequestLogicTypes.IPendingRequest | null {
    // Compute the diff between the confirmed and pending request
    let pending: any = null;
    if (!requestStateConfirmed) {
      pending = requestStatePending;
    } else if (requestStatePending) {
      for (const key in requestStatePending) {
        if (requestStatePending.hasOwnProperty(key)) {
          // TODO: Should find a better way to do that
          if (
            Utils.crypto.normalizeKeccak256Hash(requestStatePending[key]).value !==
            Utils.crypto.normalizeKeccak256Hash(requestStateConfirmed[key]).value
          ) {
            if (!pending) {
              pending = {};
            }
            // tslint:disable-next-line:prefer-conditional-expression
            if (key === 'events') {
              // keep only the new events in pending
              pending[key] = requestStatePending[key].slice(requestStateConfirmed[key].length);
            } else {
              pending[key] = requestStatePending[key];
            }
          }
        }
      }
    }
    return pending as RequestLogicTypes.IPendingRequest | null;
  }

  /**
   * Sorts out the transactions pending older than confirmed ones
   *
   * @param actions list of the actions
   * @returns an object with the ignoredTransactions and the kept actions
   */
  private removeOldPendingTransactions(
    transactions: Array<TransactionTypes.ITimestampedTransaction | null>,
  ): {
    ignoredTransactions: any[];
    keptTransactions: Array<TransactionTypes.ITimestampedTransaction | null>;
  } {
    const ignoredTransactions: any[] = [];

    // ignored the transactions pending older than confirmed ones
    let confirmedFound = false;
    const keptTransactions = transactions
      .reverse()
      .filter(action => {
        if (!action) {
          return false;
        }

        // Have we already found confirmed transactions
        confirmedFound =
          confirmedFound || action.state === TransactionTypes.TransactionState.CONFIRMED;

        // keep the transaction if confirmed or pending but no confirmed found before
        if (
          action.state === TransactionTypes.TransactionState.CONFIRMED ||
          (action.state === TransactionTypes.TransactionState.PENDING && !confirmedFound)
        ) {
          return true;
        } else {
          // Keeps the ignored transactions
          ignoredTransactions.push({
            reason: 'Confirmed transaction newer than this pending transaction',
            transaction: action,
          });
          return false;
        }
      })
      .reverse();

    return { ignoredTransactions, keptTransactions };
  }
}
