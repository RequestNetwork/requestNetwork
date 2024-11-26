import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { PaymentNetworkFactory, PaymentNetworkOptions } from '@requestnetwork/payment-detection';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogicTypes,
  ClientTypes,
  CurrencyTypes,
  CipherProviderTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import { deepCopy, supportedIdentities } from '@requestnetwork/utils';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
import Request from './request';
import localUtils from './utils';
import { NoPersistHttpDataAccess } from '../no-persist-http-data-access';

/**
 * Entry point of the request-client.js library. Create requests, get requests, manipulate requests.
 */
export default class RequestNetwork {
  public paymentNetworkFactory: PaymentNetworkFactory;
  public supportedIdentities: IdentityTypes.TYPE[] = supportedIdentities;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private transaction: TransactionTypes.ITransactionManager;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  private dataAccess: DataAccessTypes.IDataAccess;

  private contentData: ContentDataExtension;
  private currencyManager: CurrencyTypes.ICurrencyManager;

  /**
   * @param dataAccess instance of data-access layer
   * @param signatureProvider module in charge of the signatures
   * @param decryptionProvider module in charge of the decryption
   * @param paymentOptions options for payment detection
   */
  public constructor({
    dataAccess,
    signatureProvider,
    decryptionProvider,
    cipherProvider,
    currencyManager,
    paymentOptions,
  }: {
    dataAccess: DataAccessTypes.IDataAccess;
    signatureProvider?: SignatureProviderTypes.ISignatureProvider;
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
    cipherProvider?: CipherProviderTypes.ICipherProvider;
    currencyManager?: CurrencyTypes.ICurrencyManager;
    paymentOptions?: Partial<PaymentNetworkOptions>;
  }) {
    this.currencyManager = currencyManager || CurrencyManager.getDefault();
    this.dataAccess = dataAccess;
    this.advancedLogic = new AdvancedLogic(this.currencyManager);
    this.transaction = new TransactionManager(dataAccess, decryptionProvider, cipherProvider);
    this.requestLogic = new RequestLogic(this.transaction, signatureProvider, this.advancedLogic);
    this.contentData = new ContentDataExtension(this.advancedLogic);
    this.paymentNetworkFactory = new PaymentNetworkFactory(
      this.advancedLogic,
      this.currencyManager,
      paymentOptions,
    );
  }

  /**
   * Creates a request.
   *
   * @param requestParameters Parameters to create a request
   * @returns The created request
   */
  public async createRequest(
    parameters: Types.ICreateRequestParameters,
    options?: Types.ICreateRequestOptions,
  ): Promise<Request> {
    const { requestParameters, topics, paymentNetwork } =
      await this.prepareRequestParameters(parameters);

    const requestLogicCreateResult = await this.requestLogic.createRequest(
      requestParameters,
      parameters.signer,
      topics,
    );

    const transactionData = requestLogicCreateResult.meta?.transactionManagerMeta.transactionData;
    const requestId = requestLogicCreateResult.result.requestId;
    const isSkippingPersistence = this.dataAccess instanceof NoPersistHttpDataAccess;
    // create the request object
    const request = new Request(requestId, this.requestLogic, this.currencyManager, {
      contentDataExtension: this.contentData,
      paymentNetwork,
      requestLogicCreateResult,
      skipPaymentDetection: parameters.disablePaymentDetection,
      disableEvents: parameters.disableEvents,
      // inMemoryInfo is only used when skipPersistence is enabled
      inMemoryInfo: isSkippingPersistence
        ? {
            topics: requestLogicCreateResult.meta.transactionManagerMeta?.topics,
            transactionData: transactionData,
            requestData: this.prepareRequestDataForPayment(transactionData, requestId),
          }
        : null,
    });

    if (!options?.skipRefresh && !isSkippingPersistence) {
      // refresh the local request data
      await request.refresh();
    }

    return request;
  }

  /**
   * Persists an in-memory request to the data-access layer.
   *
   * This method is used to persist requests that were initially created with skipPersistence enabled.
   *
   * @param request The Request object to persist. This must be a request that was created with skipPersistence enabled.
   * @returns A promise that resolves to the result of the persist transaction operation.
   * @throws {Error} If the request's `inMemoryInfo` is not provided, indicating it wasn't created with skipPersistence.
   * @throws {Error} If the current data access instance does not support persistence (e.g., NoPersistHttpDataAccess).
   */
  public async persistRequest(
    request: Request,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    if (!request.inMemoryInfo) {
      throw new Error('Cannot persist request without inMemoryInfo.');
    }

    if (this.dataAccess instanceof NoPersistHttpDataAccess) {
      throw new Error(
        'Cannot persist request when skipPersistence is enabled. To persist the request, create a new instance of RequestNetwork without skipPersistence being set to true.',
      );
    }
    const result: DataAccessTypes.IReturnPersistTransaction =
      await this.dataAccess.persistTransaction(
        request.inMemoryInfo.transactionData,
        request.requestId,
        request.inMemoryInfo.topics,
      );

    return result;
  }

  /**
   * Creates an encrypted request.
   *
   * @param parameters Parameters to create a request
   * @param encryptionParams Request encryption parameters
   * @returns The created encrypted request
   */
  public async _createEncryptedRequest(
    parameters: Types.ICreateRequestParameters,
    encryptionParams: EncryptionTypes.IEncryptionParameters[],
    options?: Types.ICreateRequestOptions,
  ): Promise<Request> {
    const { requestParameters, topics, paymentNetwork } =
      await this.prepareRequestParameters(parameters);

    const requestLogicCreateResult = await this.requestLogic.createEncryptedRequest(
      requestParameters,
      parameters.signer,
      encryptionParams,
      topics,
    );

    const transactionData = requestLogicCreateResult.meta?.transactionManagerMeta.transactionData;
    const requestId = requestLogicCreateResult.result.requestId;
    const isSkippingPersistence = this.dataAccess instanceof NoPersistHttpDataAccess;

    // create the request object
    const request = new Request(requestId, this.requestLogic, this.currencyManager, {
      contentDataExtension: this.contentData,
      paymentNetwork,
      requestLogicCreateResult,
      skipPaymentDetection: parameters.disablePaymentDetection,
      disableEvents: parameters.disableEvents,
      inMemoryInfo: isSkippingPersistence
        ? {
            topics: requestLogicCreateResult.meta.transactionManagerMeta?.topics,
            transactionData: transactionData,
            requestData: this.prepareRequestDataForPayment(transactionData, requestId),
          }
        : null,
    });

    if (!options?.skipRefresh && !isSkippingPersistence) {
      // refresh the local request data
      await request.refresh();
    }

    return request;
  }

  /**
   * Gets the ID of a request without creating it.
   *
   * @param requestParameters Parameters to create a request
   * @returns The requestId
   */
  public async computeRequestId(
    parameters: Types.ICreateRequestParameters,
  ): Promise<RequestLogicTypes.RequestId> {
    const { requestParameters } = await this.prepareRequestParameters(parameters);
    return this.requestLogic.computeRequestId(requestParameters, parameters.signer);
  }

  /**
   * Create a Request instance from an existing Request's ID
   *
   * @param requestId The ID of the Request
   * @param options options
   * @returns the Request
   */
  public async fromRequestId(
    requestId: RequestLogicTypes.RequestId,
    options?: {
      disablePaymentDetection?: boolean;
      disableEvents?: boolean;
    },
  ): Promise<Request> {
    const requestAndMeta: RequestLogicTypes.IReturnGetRequestFromId =
      await this.requestLogic.getRequestFromId(requestId);

    // if no request found, throw a human readable message:
    if (!requestAndMeta.result.request && !requestAndMeta.result.pending) {
      throw new Error(localUtils.formatGetRequestFromIdError(requestAndMeta));
    }

    // get the request state. If the creation is not confirmed yet, get the pending state (useful for the payment network)
    const requestState: RequestLogicTypes.IRequest = requestAndMeta.result.request
      ? requestAndMeta.result.request
      : (requestAndMeta.result.pending as RequestLogicTypes.IRequest);
    const paymentNetwork = this.paymentNetworkFactory.getPaymentNetworkFromRequest(requestState);

    // create the request object
    const request = new Request(requestId, this.requestLogic, this.currencyManager, {
      contentDataExtension: this.contentData,
      paymentNetwork,
      skipPaymentDetection: options?.disablePaymentDetection,
      disableEvents: options?.disableEvents,
    });

    // refresh the local request data
    await request.refresh(requestAndMeta);

    return request;
  }

  /**
   * Create an array of request instances from an identity
   *
   * @param updatedBetween filter the requests with time boundaries
   * @param options options
   * @returns the Requests
   */
  public async fromIdentity(
    identity: IdentityTypes.IIdentity,
    updatedBetween?: Types.ITimestampBoundaries,
    options?: {
      disablePaymentDetection?: boolean;
      disableEvents?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<Request[]> {
    if (!this.supportedIdentities.includes(identity.type)) {
      throw new Error(`${identity.type} is not supported`);
    }
    return this.fromTopic(identity, updatedBetween, options);
  }

  /**
   * Create an array of request instances from multiple identities
   *
   * @param updatedBetween filter the requests with time boundaries
   * @param disablePaymentDetection if true, skip the payment detection
   * @returns the requests
   */
  public async fromMultipleIdentities(
    identities: IdentityTypes.IIdentity[],
    updatedBetween?: Types.ITimestampBoundaries,
    options?: {
      disablePaymentDetection?: boolean;
      disableEvents?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<Request[]> {
    const identityNotSupported = identities.find(
      (identity) => !this.supportedIdentities.includes(identity.type),
    );

    if (identityNotSupported) {
      throw new Error(`${identityNotSupported.type} is not supported`);
    }

    return this.fromMultipleTopics(identities, updatedBetween, options);
  }

  /**
   * Create an array of request instances from a topic
   *
   * @param updatedBetween filter the requests with time boundaries
   * @param options options
   * @returns the Requests
   */
  public async fromTopic(
    topic: any,
    updatedBetween?: Types.ITimestampBoundaries,
    options?: {
      disablePaymentDetection?: boolean;
      disableEvents?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic =
      await this.requestLogic.getRequestsByTopic(
        topic,
        updatedBetween,
        options?.page,
        options?.pageSize,
      );
    // From the requests of the request-logic layer creates the request objects and gets the payment networks
    const requestPromises = requestsAndMeta.result.requests.map(
      async (requestFromLogic: {
        request: RequestLogicTypes.IRequest | null;
        pending: RequestLogicTypes.IPendingRequest | null;
      }): Promise<Request> => {
        // get the request state. If the creation is not confirmed yet, get the pending state (useful for the payment network)
        const requestState: RequestLogicTypes.IRequest = requestFromLogic.request
          ? requestFromLogic.request
          : (requestFromLogic.pending as RequestLogicTypes.IRequest);

        const paymentNetwork =
          this.paymentNetworkFactory.getPaymentNetworkFromRequest(requestState);

        // create the request object
        const request = new Request(
          requestState.requestId,
          this.requestLogic,
          this.currencyManager,
          {
            contentDataExtension: this.contentData,
            paymentNetwork,
            skipPaymentDetection: options?.disablePaymentDetection,
            disableEvents: options?.disableEvents,
          },
        );

        // refresh the local request data
        await request.refresh();

        return request;
      },
    );

    return Promise.all(requestPromises);
  }

  /**
   * Create an array of request instances from a multiple topics
   *
   * @param updatedBetween filter the requests with time boundaries
   * @param options options
   * @returns the Requests
   */
  public async fromMultipleTopics(
    topics: any[],
    updatedBetween?: Types.ITimestampBoundaries,
    options?: {
      disablePaymentDetection?: boolean;
      disableEvents?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic =
      await this.requestLogic.getRequestsByMultipleTopics(
        topics,
        updatedBetween,
        options?.page,
        options?.pageSize,
      );

    // From the requests of the request-logic layer creates the request objects and gets the payment networks
    const requestPromises = requestsAndMeta.result.requests.map(
      async (requestFromLogic: {
        request: RequestLogicTypes.IRequest | null;
        pending: RequestLogicTypes.IPendingRequest | null;
      }): Promise<Request> => {
        // get the request state. If the creation is not confirmed yet, get the pending state (useful for the payment network)
        const requestState: RequestLogicTypes.IRequest = requestFromLogic.request
          ? requestFromLogic.request
          : (requestFromLogic.pending as RequestLogicTypes.IRequest);

        const paymentNetwork =
          this.paymentNetworkFactory.getPaymentNetworkFromRequest(requestState);

        // create the request object
        const request = new Request(
          requestState.requestId,
          this.requestLogic,
          this.currencyManager,
          {
            contentDataExtension: this.contentData,
            paymentNetwork,
            skipPaymentDetection: options?.disablePaymentDetection,
            disableEvents: options?.disableEvents,
          },
        );

        // refresh the local request data
        await request.refresh();

        return request;
      },
    );

    return Promise.all(requestPromises);
  }

  /*
   * If request currency is a string, convert it to currency object
   */
  private getCurrency(input: string | RequestLogicTypes.ICurrency): RequestLogicTypes.ICurrency {
    if (typeof input === 'string') {
      const currency = this.currencyManager.from(input);
      if (!currency) {
        throw new UnsupportedCurrencyError(input);
      }
      return CurrencyManager.toStorageCurrency(currency);
    }
    return input;
  }

  /**
   * A helper to validate and prepare the parameters of a request.
   * @param parameters Parameters to create a request
   * @returns the parameters, ready for request creation, the topics, and the paymentNetwork
   */
  private async prepareRequestParameters(parameters: Types.ICreateRequestParameters): Promise<{
    requestParameters: RequestLogicTypes.ICreateParameters;
    topics: any[];
    paymentNetwork: PaymentTypes.IPaymentNetwork | null;
  }> {
    const currency = this.getCurrency(parameters.requestInfo.currency);

    const requestParameters = {
      ...parameters.requestInfo,
      currency,
    };
    const contentData = parameters.contentData;
    const topics = parameters.topics?.slice() || [];

    // Check that currency is valid
    if (!this.currencyManager.validateCurrency(currency)) {
      throw new Error('The currency is not valid');
    }

    // avoid mutation of the parameters
    const copiedRequestParameters = deepCopy(requestParameters);
    copiedRequestParameters.extensionsData = [];

    const detectionChain =
      parameters?.paymentNetwork?.parameters && 'network' in parameters.paymentNetwork.parameters
        ? parameters.paymentNetwork.parameters.network ?? requestParameters.currency.network
        : requestParameters.currency.network;

    const paymentNetwork = parameters.paymentNetwork
      ? this.paymentNetworkFactory.createPaymentNetwork(
          parameters.paymentNetwork.id,
          requestParameters.currency.type,
          detectionChain,
        )
      : null;

    if (paymentNetwork) {
      // create the extensions data for the payment network
      copiedRequestParameters.extensionsData.push(
        await paymentNetwork.createExtensionsDataForCreation(
          parameters.paymentNetwork?.parameters || {},
        ),
      );
    }

    if (contentData) {
      // create the extensions data for the content data
      copiedRequestParameters.extensionsData.push(
        this.contentData.createExtensionsDataForCreation(contentData),
      );
    }

    // add identities as topics
    if (copiedRequestParameters.payee) {
      topics.push(copiedRequestParameters.payee);
    }
    if (copiedRequestParameters.payer) {
      topics.push(copiedRequestParameters.payer);
    }

    if (requestParameters.extensionsData) {
      copiedRequestParameters.extensionsData.push(...requestParameters.extensionsData);
    }

    return { requestParameters: copiedRequestParameters, topics, paymentNetwork };
  }

  /**
   * Prepares a payment request structure from transaction data.
   *
   * This method is used to create a request structure similar to a persisted request,
   * allowing users to pay before the request is persisted. This is useful in scenarios
   * where a request is created, paid, and then persisted, as opposed to the normal flow
   * of creating, persisting, and then paying the request.
   *
   * @param transactionData The transaction data containing the request information
   * @param requestId The ID of the request
   * @returns The prepared payment request structure or undefined if transaction data is missing
   */
  private prepareRequestDataForPayment(
    transactionData: DataAccessTypes.ITransaction,
    requestId: string,
  ): ClientTypes.IRequestData {
    const requestData = JSON.parse(transactionData.data as string).data;
    const newExtensions: RequestLogicTypes.IExtensionStates = {};

    for (const extension of requestData.parameters.extensionsData) {
      if (extension.id !== ExtensionTypes.OTHER_ID.CONTENT_DATA) {
        newExtensions[extension.id] = {
          events: [
            {
              name: extension.action,
              parameters: {
                paymentAddress: extension.parameters.paymentAddress,
                salt: extension.parameters.salt,
                feeAddress: extension.parameters.feeAddress,
                feeAmount: extension.parameters.feeAmount,
              },
              timestamp: requestData.parameters.timestamp,
            },
          ],
          id: extension.id,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            salt: extension.parameters.salt,
            receivedPaymentAmount: '0',
            receivedRefundAmount: '0',
            sentPaymentAmount: '0',
            sentRefundAmount: '0',
            paymentAddress: extension.parameters.paymentAddress,
            feeAddress: extension.parameters.feeAddress,
            feeAmount: extension.parameters.feeAmount,
          },
          version: extension.version,
        };
      }
    }

    return {
      ...requestData.parameters,
      requestId,
      meta: null,
      balance: null,
      currency: requestData.parameters.currency.type,
      currencyInfo: {
        type: requestData.parameters.currency.type,
        network: requestData.parameters.currency.network,
        value: requestData.parameters.currency.value || '',
      },
      contentData: requestData.parameters.extensionsData.find(
        (ext: ExtensionTypes.IAction) => ext.id === ExtensionTypes.OTHER_ID.CONTENT_DATA,
      )?.parameters.content,
      pending: null,
      extensions: newExtensions,
    };
  }
}
