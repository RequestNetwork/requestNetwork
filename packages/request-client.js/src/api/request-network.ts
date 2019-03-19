import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogic as AdvancedLogicTypes,
  DataAccess as DataAccessTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
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
   */
  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    signatureProvider?: SignatureProviderTypes.ISignatureProvider,
  ) {
    this.advancedLogic = new AdvancedLogic();
    this.transaction = new TransactionManager(dataAccess);
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
    const requestParameters = parameters.requestInfo;
    const paymentNetworkCreationParameters = parameters.paymentNetwork;
    const contentData = parameters.contentData;
    const topics = parameters.topics || [];

    if (requestParameters.extensionsData) {
      throw new Error('extensionsData in request parameters must be empty');
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
      topics.push(copiedRequestParameters.payee.value);
    }
    if (copiedRequestParameters.payer) {
      topics.push(copiedRequestParameters.payer.value);
    }

    const {
      result: { requestId },
    } = await this.requestLogic.createRequest(copiedRequestParameters, parameters.signer, topics);

    // create the request object
    const request = new Request(this.requestLogic, requestId, paymentNetwork, this.contentData);

    // refresh the local request data
    await request.refresh();

    return request;
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
   * Create an array of Request instances from an identity
   *
   * @param identity
   * @returns the Requests
   */
  public async fromIdentity(
    identity: IdentityTypes.IIdentity,
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    if (identity.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
      throw new Error(`${identity.type} is not supported`);
    }
    return this.fromTopic(identity.value, updatedBetween);
  }

  /**
   * Create an array of Request instances from a topic
   *
   * @param topic
   * @returns the Requests
   */
  public async fromTopic(
    topic: string,
    updatedBetween?: Types.ITimestampBoundaries,
  ): Promise<Request[]> {
    // Gets all the requests indexed by the value of the identity
    const requestsAndMeta: RequestLogicTypes.IReturnGetRequestsByTopic = await this.requestLogic.getRequestsByTopic(
      topic,
      updatedBetween,
    );
    // From the requests of the Request-logic creates the request objects and gets the payment networks
    const requests = requestsAndMeta.result.requests.map(
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

    return Promise.all(requests);
  }
}
