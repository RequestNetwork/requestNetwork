import {
  AdvancedLogic as AdvancedLogicTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestLogicCore from './requestLogicCore';

import Action from './action';

// Temporary object to compute requests from transactions
interface IActionRequestIdTransactionPosition {
  action: Types.IAction;
  requestId: Types.RequestId;
  position: number;
}

/**
 * Implementation of Request Logic
 */
export default class RequestLogic implements Types.IRequestLogic {
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
    requestParameters: Types.ICreateParameters,
    signerIdentity: IdentityTypes.IIdentity,
    indexes: string[] = [],
  ): Promise<Types.IReturnCreateRequest> {
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
    requestParameters: Types.IAcceptParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestLogicReturn> {
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
    requestParameters: Types.ICancelParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestLogicReturn> {
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
    requestParameters: Types.IIncreaseExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestLogicReturn> {
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
    requestParameters: Types.IReduceExpectedAmountParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestLogicReturn> {
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
    requestParameters: Types.IAddExtensionsDataParameters,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestLogicReturn> {
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
  public async getRequestFromId(requestId: string): Promise<Types.IReturnGetRequestFromId> {
    const resultGetTx = await this.transactionManager.getTransactionsByChannelId(requestId);
    const actions = resultGetTx.result.transactions;

    // array of transaction without duplicates to avoid replay attack
    const transactionsWithoutDuplicates = Utils.unique(
      actions
        .map((t: any) => {
          // We ignore the transaction.data that cannot be parsed
          try {
            return JSON.parse(t.data);
          } catch (e) {
            return;
          }
        })
        .filter((elem: any) => elem !== undefined),
    );

    const ignoredTransactions = transactionsWithoutDuplicates.duplicates;

    // second parameter is null, because the first action must be a creation (no state expected)
    const request = transactionsWithoutDuplicates.uniqueItems.reduce(
      (requestState: any, action: any) => {
        try {
          return RequestLogicCore.applyActionToRequest(requestState, action, this.advancedLogic);
        } catch (e) {
          // if an error occurs during the apply we ignore the action
          ignoredTransactions.push(action);
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
  public async getRequestsByTopic(topic: string): Promise<Types.IReturnGetRequestsByTopic> {
    const getTxResult = await this.transactionManager.getTransactionsByTopic(topic);
    const transactions = getTxResult.result.transactions;
    const transactionManagerMeta = getTxResult.meta.dataAccessMeta;

    // Parses all the actions from the transactions but keep the transaction position to get the meta later
    const actionsAndTxPositions: IActionRequestIdTransactionPosition[] = Utils.unique(transactions)
      .uniqueItems.map((transaction: TransactionTypes.ITransaction, position: number) => {
        // We ignore the transaction.data that cannot be parsed
        try {
          const action = JSON.parse(transaction.data);
          return { action, requestId: Action.getRequestId(action), position };
        } catch (e) {
          return { action: null, requestId: '', position };
        }
      })
      .filter((elem: any) => elem.action !== null);

    // Group the actions by requestId
    const actionsAndTxPositionsGroupByRequestId: {
      [key: string]: IActionRequestIdTransactionPosition[];
    } = actionsAndTxPositions.reduce(
      (
        result: {
          [key: string]: IActionRequestIdTransactionPosition[];
        },
        actionAndTxPosition: IActionRequestIdTransactionPosition,
      ) => {
        result[actionAndTxPosition.requestId] = (
          result[actionAndTxPosition.requestId] || []
        ).concat([actionAndTxPosition]);
        return result;
      },
      {},
    );

    // For every group of actions...
    const allRequestAndMeta = Object.values(actionsAndTxPositionsGroupByRequestId).map(
      actionsAndTxPositionsOfARequest => {
        // ...creates the request from these actions and registers the ignored transactions
        return actionsAndTxPositionsOfARequest.reduce(
          (requestStateAndMeta: any, actionAndPosition: any) => {
            try {
              // apply the current action to the request
              requestStateAndMeta.request = RequestLogicCore.applyActionToRequest(
                requestStateAndMeta.request,
                actionAndPosition.action,
                this.advancedLogic,
              );
            } catch (e) {
              // if an error occurs during the apply we ignore the action and declare the ignored transaction
              requestStateAndMeta.ignoredTransactions.push(
                transactions[actionAndPosition.position],
              );
            }
            return requestStateAndMeta;
          },
          // request is null, because the first action must be a creation (no state expected)
          { request: null, ignoredTransactions: [] },
        );
      },
    );

    // Merge all the requests and meta in one object
    return allRequestAndMeta.reduce(
      (finalResult: Types.IReturnGetRequestsByTopic, requestAndMeta: any) => {
        if (requestAndMeta.request) {
          finalResult.result.requests.push(requestAndMeta.request);
          // workaround to quiet the error "finalResult.meta.ignoredTransactions can be undefined" (but defined in the initialization value of the accumulator)
          (finalResult.meta.ignoredTransactions || []).push(requestAndMeta.ignoredTransactions);
        }

        return finalResult;
      },
      {
        meta: {
          ignoredTransactions: [],
          transactionManagerMeta,
        },
        result: { requests: [] },
      },
    );
  }
}
