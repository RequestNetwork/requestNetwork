import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { PaymentNetworkFactory, PaymentNetworkOptions } from '@requestnetwork/payment-detection';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogicTypes,
  CurrencyTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
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

/**
 * Entry point of the request-client.js library. Create requests, get requests, manipulate requests.
 */
export default class RequestNetwork {
  public paymentNetworkFactory: PaymentNetworkFactory;
  public supportedIdentities: IdentityTypes.TYPE[] = supportedIdentities;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private transaction: TransactionTypes.ITransactionManager;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

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
    currencyManager,
    paymentOptions,
  }: {
    dataAccess: DataAccessTypes.IDataAccess;
    signatureProvider?: SignatureProviderTypes.ISignatureProvider;
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
    currencyManager?: CurrencyTypes.ICurrencyManager;
    paymentOptions?: Partial<PaymentNetworkOptions>;
  }) {
    this.currencyManager = currencyManager || CurrencyManager.getDefault();
    this.advancedLogic = new AdvancedLogic(this.currencyManager);
    this.transaction = new TransactionManager(dataAccess, decryptionProvider);
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
    const { requestParameters, topics, paymentNetwork } = await this.prepareRequestParameters(
      parameters,
    );

    const requestLogicCreateResult = await this.requestLogic.createRequest(
      requestParameters,
      parameters.signer,
      topics,
    );

    // create the request object
    const request = new Request(
      requestLogicCreateResult.result.requestId,
      this.requestLogic,
      this.currencyManager,
      {
        contentDataExtension: this.contentData,
        paymentNetwork,
        requestLogicCreateResult,
        skipPaymentDetection: parameters.disablePaymentDetection,
        disableEvents: parameters.disableEvents,
      },
    );

    if (!options?.skipRefresh) {
      // refresh the local request data
      await request.refresh();
    }

    return request;
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
    const { requestParameters, topics, paymentNetwork } = await this.prepareRequestParameters(
      parameters,
    );

    const requestLogicCreateResult = await this.requestLogic.createEncryptedRequest(
      requestParameters,
      parameters.signer,
      encryptionParams,
      topics,
    );

    // create the request object
    const request = new Request(
      requestLogicCreateResult.result.requestId,
      this.requestLogic,
      this.currencyManager,
      {
        contentDataExtension: this.contentData,
        paymentNetwork,
        requestLogicCreateResult,
        skipPaymentDetection: parameters.disablePaymentDetection,
        disableEvents: parameters.disableEvents,
      },
    );

    if (!options?.skipRefresh) {
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
    options?: { disablePaymentDetection?: boolean; disableEvents?: boolean },
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
    options?: { disablePaymentDetection?: boolean; disableEvents?: boolean },
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
    options?: { disablePaymentDetection?: boolean; disableEvents?: boolean },
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic =
      await this.requestLogic.getRequestsByTopic(topic, updatedBetween);
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
    options?: { disablePaymentDetection?: boolean; disableEvents?: boolean },
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic =
      await this.requestLogic.getRequestsByMultipleTopics(topics, updatedBetween);

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
        await paymentNetwork.createExtensionsDataForCreation(parameters.paymentNetwork?.parameters),
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
}
