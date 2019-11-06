import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogicTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import { IEncryptionParameters } from '@requestnetwork/types/dist/encryption-types';
import Utils from '@requestnetwork/utils';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
import { stringToCurrency } from './currency';
import { validERC20Address } from './currency/erc20';
import PaymentNetworkFactory from './payment-network/payment-network-factory';
import Request from './request';

/**
 * Entry point of the request-client.js library. Create requests, get requests, manipulate requests.
 */
export default class RequestNetwork {
  private requestLogic: RequestLogicTypes.IRequestLogic;
  private transaction: TransactionTypes.ITransactionManager;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

  private contentData: ContentDataExtension;

  /**
   * @param dataAccess instance of data-access layer
   * @param signatureProvider module in charge of the signatures
   * @param decryptionProvider module in charge of the decryption
   */
  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    signatureProvider?: SignatureProviderTypes.ISignatureProvider,
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
  ) {
    this.advancedLogic = new AdvancedLogic();
    this.transaction = new TransactionManager(dataAccess, decryptionProvider);
    this.requestLogic = new RequestLogic(this.transaction, signatureProvider, this.advancedLogic);
    this.contentData = new ContentDataExtension(this.advancedLogic);
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
    const {
      result: { requestId },
    } = await this.requestLogic.createRequest(requestParameters, parameters.signer, topics);

    // create the request object
    const request = new Request(this.requestLogic, requestId, paymentNetwork, this.contentData);

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
    encryptionParams: IEncryptionParameters[],
  ): Promise<Request> {
    const { requestParameters, topics, paymentNetwork } = await this.prepareRequestParameters(
      parameters,
    );
    const {
      result: { requestId },
    } = await this.requestLogic.createEncryptedRequest(
      requestParameters,
      parameters.signer,
      encryptionParams,
      topics,
    );

    // create the request object
    const request = new Request(this.requestLogic, requestId, paymentNetwork, this.contentData);

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
   * @returns the Request
   */
  public async fromRequestId(requestId: RequestLogicTypes.RequestId): Promise<Request> {
    const requestAndMeta: RequestLogicTypes.IReturnGetRequestFromId = await this.requestLogic.getRequestFromId(
      requestId,
    );

    let paymentNetwork: Types.IPaymentNetwork | null = null;
    if (requestAndMeta.result.request) {
      paymentNetwork = PaymentNetworkFactory.getPaymentNetworkFromRequest(
        this.advancedLogic,
        requestAndMeta.result.request,
      );
    }

    // create the request object
    const request = new Request(this.requestLogic, requestId, paymentNetwork, this.contentData);

    // refresh the local request data
    await request.refresh();

    return request;
  }

  /**
   * Create an array of request instances from an identity
   *
   * @param identity
   * @param updatedBetween filter the requests with time boundaries
   * @returns the Requests
   */
  public async fromIdentity(
    identity: IdentityTypes.IIdentity,
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    if (identity.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
      throw new Error(`${identity.type} is not supported`);
    }
    return this.fromTopic(identity, updatedBetween);
  }

  /**
   * Create an array of request instances from multiple identities
   *
   * @param identities
   * @param updatedBetween filter the requests with time boundaries
   * @returns the requests
   */
  public async fromMultipleIdentities(
    identities: IdentityTypes.IIdentity[],
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    const identityNotSupported = identities.find(
      identity => identity.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    );

    if (identityNotSupported) {
      throw new Error(`${identityNotSupported.type} is not supported`);
    }

    return this.fromMultipleTopics(identities, updatedBetween);
  }

  /**
   * Create an array of request instances from a topic
   *
   * @param topic
   * @param updatedBetween filter the requests with time boundaries
   * @returns the Requests
   */
  public async fromTopic(
    topic: any,
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic = await this.requestLogic.getRequestsByTopic(
      topic,
      updatedBetween,
    );
    // From the requests of the request-logic layer creates the request objects and gets the payment networks
    const requestPromises = requestsAndMeta.result.requests.map(
      async (requestFromLogic: RequestLogicTypes.IRequest): Promise<Request> => {
        const paymentNetwork: Types.IPaymentNetwork | null = PaymentNetworkFactory.getPaymentNetworkFromRequest(
          this.advancedLogic,
          requestFromLogic,
        );

        // create the request object
        const request = new Request(
          this.requestLogic,
          requestFromLogic.requestId,
          paymentNetwork,
          this.contentData,
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
   * @returns the Requests
   */
  public async fromMultipleTopics(
    topics: any[],
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic = await this.requestLogic.getRequestsByMultipleTopics(
      topics,
      updatedBetween,
    );

    // From the requests of the request-logic layer creates the request objects and gets the payment networks
    const requestPromises = requestsAndMeta.result.requests.map(
      async (requestFromLogic: RequestLogicTypes.IRequest): Promise<Request> => {
        const paymentNetwork: Types.IPaymentNetwork | null = PaymentNetworkFactory.getPaymentNetworkFromRequest(
          this.advancedLogic,
          requestFromLogic,
        );

        // create the request object
        const request = new Request(
          this.requestLogic,
          requestFromLogic.requestId,
          paymentNetwork,
          this.contentData,
        );

        // refresh the local request data
        await request.refresh();

        return request;
      },
    );

    return Promise.all(requestPromises);
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
    paymentNetwork: Types.IPaymentNetwork | null;
  }> {
    const requestParameters = parameters.requestInfo;
    const paymentNetworkCreationParameters = parameters.paymentNetwork;
    const contentData = parameters.contentData;
    const topics = parameters.topics || [];

    if (requestParameters.extensionsData) {
      throw new Error('extensionsData in request parameters must be empty');
    }

    // if request currency is a string, convert it to currency object
    if (typeof requestParameters.currency === 'string') {
      requestParameters.currency = stringToCurrency(requestParameters.currency);
    } else {
      // If ERC20, validate that the value is a checksum address
      if (requestParameters.currency.type === RequestLogicTypes.CURRENCY.ERC20) {
        if (!validERC20Address(requestParameters.currency.value)) {
          throw new Error(
            'The ERC20 currency address needs to be a valid Ethereum checksum address',
          );
        }
      }
    }

    // avoid mutation of the parameters
    const copiedRequestParameters = Utils.deepCopy(requestParameters);
    copiedRequestParameters.extensionsData = [];

    let paymentNetwork: Types.IPaymentNetwork | null = null;
    if (paymentNetworkCreationParameters) {
      paymentNetwork = PaymentNetworkFactory.createPaymentNetwork(
        this.advancedLogic,
        requestParameters.currency,
        paymentNetworkCreationParameters,
      );

      if (paymentNetwork) {
        // create the extensions data for the payment network
        copiedRequestParameters.extensionsData.push(
          paymentNetwork.createExtensionsDataForCreation(
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
}
