import { utils as ethersUtils } from 'ethers';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogicTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import {
  CurrencyInput,
  CurrencyManager,
  ICurrencyManager,
  UnsupportedCurrencyError,
} from '@requestnetwork/currency';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
import Request from './request';
import localUtils from './utils';

/**
 * Entry point of the request-client.js library. Create requests, get requests, manipulate requests.
 */
export default class RequestNetwork {
  public bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  public supportedIdentities: IdentityTypes.TYPE[] = Utils.identity.supportedIdentities;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private transaction: TransactionTypes.ITransactionManager;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

  private contentData: ContentDataExtension;
  private currencyManager: ICurrencyManager;

  /**
   * @param dataAccess instance of data-access layer
   * @param signatureProvider module in charge of the signatures
   * @param decryptionProvider module in charge of the decryption
   * @param bitcoinDetectionProvider bitcoin detection provider
   */
  public constructor({
    dataAccess,
    signatureProvider,
    decryptionProvider,
    bitcoinDetectionProvider,
    currencies,
  }: {
    dataAccess: DataAccessTypes.IDataAccess;
    signatureProvider?: SignatureProviderTypes.ISignatureProvider;
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
    bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
    currencies?: CurrencyInput[];
  }) {
    this.currencyManager = new CurrencyManager(currencies || CurrencyManager.getDefaultList());
    this.advancedLogic = new AdvancedLogic(this.currencyManager);
    this.transaction = new TransactionManager(dataAccess, decryptionProvider);
    this.requestLogic = new RequestLogic(this.transaction, signatureProvider, this.advancedLogic);
    this.contentData = new ContentDataExtension(this.advancedLogic);
    this.bitcoinDetectionProvider = bitcoinDetectionProvider;
  }

  /**
   * Creates a request.
   *
   * @param requestParameters Parameters to create a request
   * @returns The created request
   */
  public async createRequest(parameters: Types.ICreateRequestParameters): Promise<Request> {
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

    // refresh the local request data
    await request.refresh();

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

    // refresh the local request data
    await request.refresh();

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
      explorerApiKeys?: Record<string, string>;
    },
  ): Promise<Request> {
    const requestAndMeta: RequestLogicTypes.IReturnGetRequestFromId = await this.requestLogic.getRequestFromId(
      requestId,
    );

    // if no request found, throw a human readable message:
    if (!requestAndMeta.result.request && !requestAndMeta.result.pending) {
      throw new Error(localUtils.formatGetRequestFromIdError(requestAndMeta));
    }

    // get the request state. If the creation is not confirmed yet, get the pending state (useful for the payment network)
    const requestState: RequestLogicTypes.IRequest = requestAndMeta.result.request
      ? requestAndMeta.result.request
      : (requestAndMeta.result.pending as RequestLogicTypes.IRequest);
    const paymentNetwork: PaymentTypes.IPaymentNetwork | null = PaymentNetworkFactory.getPaymentNetworkFromRequest(
      {
        advancedLogic: this.advancedLogic,
        bitcoinDetectionProvider: this.bitcoinDetectionProvider,
        request: requestState,
        explorerApiKeys: options?.explorerApiKeys,
        currencyManager: this.currencyManager,
      },
    );

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
   * @param identity
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
   * @param identities
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
   * @param topic
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
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic = await this.requestLogic.getRequestsByTopic(
      topic,
      updatedBetween,
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

        const paymentNetwork: PaymentTypes.IPaymentNetwork | null = PaymentNetworkFactory.getPaymentNetworkFromRequest(
          {
            advancedLogic: this.advancedLogic,
            bitcoinDetectionProvider: this.bitcoinDetectionProvider,
            request: requestState,
            currencyManager: this.currencyManager,
          },
        );

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
   * @param topics
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
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic = await this.requestLogic.getRequestsByMultipleTopics(
      topics,
      updatedBetween,
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

        const paymentNetwork: PaymentTypes.IPaymentNetwork | null = PaymentNetworkFactory.getPaymentNetworkFromRequest(
          {
            advancedLogic: this.advancedLogic,
            bitcoinDetectionProvider: this.bitcoinDetectionProvider,
            request: requestState,
            currencyManager: this.currencyManager,
          },
        );

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
  private async prepareRequestParameters(
    parameters: Types.ICreateRequestParameters,
  ): Promise<{
    requestParameters: RequestLogicTypes.ICreateParameters;
    topics: any[];
    paymentNetwork: PaymentTypes.IPaymentNetwork | null;
  }> {
    const currency = this.getCurrency(parameters.requestInfo.currency);

    const requestParameters = {
      ...parameters.requestInfo,
      currency,
    };
    const paymentNetworkCreationParameters = parameters.paymentNetwork;
    const contentData = parameters.contentData;
    const topics = parameters.topics?.slice() || [];

    if (requestParameters.extensionsData) {
      throw new Error('extensionsData in request parameters must be empty');
    }

    // If ERC20, validate that the value is a checksum address
    if (requestParameters.currency.type === RequestLogicTypes.CURRENCY.ERC20) {
      if (!this.validERC20Address(requestParameters.currency.value)) {
        throw new Error('The ERC20 currency address needs to be a valid Ethereum checksum address');
      }
    }

    // avoid mutation of the parameters
    const copiedRequestParameters = Utils.deepCopy(requestParameters);
    copiedRequestParameters.extensionsData = [];

    let paymentNetwork: PaymentTypes.IPaymentNetwork | null = null;
    if (paymentNetworkCreationParameters) {
      paymentNetwork = PaymentNetworkFactory.createPaymentNetwork({
        advancedLogic: this.advancedLogic,
        bitcoinDetectionProvider: this.bitcoinDetectionProvider,
        currency: requestParameters.currency,
        paymentNetworkCreationParameters,
        currencyManager: this.currencyManager,
      });

      if (paymentNetwork) {
        // create the extensions data for the payment network
        copiedRequestParameters.extensionsData.push(
          await paymentNetwork.createExtensionsDataForCreation(
            paymentNetworkCreationParameters.parameters,
          ),
        );
      }
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

    return { requestParameters: copiedRequestParameters, topics, paymentNetwork };
  }

  /**
   * Returns true if the address is a valid checksum address
   *
   * @param address The address to validate
   * @returns If the address is valid or not
   */
  private validERC20Address(address: string): boolean {
    return ethersUtils.getAddress(address) === address;
  }
}
