import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  AdvancedLogic as AdvancedLogicTypes,
  DataAccess as DataAccessTypes,
  RequestLogic as RequestLogicTypes,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ContentDataManager from './content-data-manager';
import PaymentNetworkFactory from './payment-network/payment-network-factory';
import Request from './request';

import * as Types from '../types';

/**
 * Entry point to create requests.
 *
 * @class RequestNetwork
 */
export default class RequestNetwork {
  private requestLogic: RequestLogicTypes.IRequestLogic;
  private transaction: TransactionTypes.ITransactionManager;
  private advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

  private contentDataManager: ContentDataManager;

  /**
   * Constructor
   *
   * @param {DataAccessTypes.IDataAccess} dataAccess module in charge of the data
   * @param {SignatureProviderTypes.ISignatureProvider} [signatureProvider] module in charge of the signatures
   * @memberof RequestNetwork
   */
  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    signatureProvider?: SignatureProviderTypes.ISignatureProvider,
  ) {
    this.advancedLogic = new AdvancedLogic();
    this.transaction = new TransactionManager(dataAccess);
    this.requestLogic = new RequestLogic(this.transaction, signatureProvider, this.advancedLogic);
    this.contentDataManager = new ContentDataManager(this.advancedLogic);
  }

  /**
   * Creates a request.
   *
   * @param requestParameters ICreateRequestParameters parameters to create a request
   * @memberof RequestNetwork
   * @returns Promise<Request> the request
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

    let paymentNetwork: Types.IPaymentNetworkManager | null = null;
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
        this.contentDataManager.createExtensionsDataForCreation(contentData),
      );
    }

    const {
      result: { requestId },
    } = await this.requestLogic.createRequest(copiedRequestParameters, parameters.signer, topics);

    // create the request object
    const request = new Request(
      this.requestLogic,
      requestId,
      paymentNetwork,
      this.contentDataManager,
    );

    // refresh the local request data
    await request.refresh();

    return request;
  }

  /**
   * Create a Request instance from an existing Request's ID
   *
   * @param {RequestLogicTypes.RequestLogicRequestId} requestId The ID of the Request
   * @returns {Request} the Request
   * @memberof RequestNetwork
   */
  public async fromRequestId(requestId: RequestLogicTypes.RequestLogicRequestId): Promise<Request> {
    const requestAndMeta: RequestLogicTypes.IRequestLogicReturnGetRequestById = await this.requestLogic.getRequestById(
      requestId,
    );

    let paymentNetwork: Types.IPaymentNetworkManager | null = null;
    if (requestAndMeta.result.request) {
      paymentNetwork = PaymentNetworkFactory.getPaymentNetworkFromRequest(
        this.advancedLogic,
        requestAndMeta.result.request,
      );
    }

    // create the request object
    const request = new Request(
      this.requestLogic,
      requestId,
      paymentNetwork,
      this.contentDataManager,
    );

    // refresh the local request data
    await request.refresh();

    return request;
  }
}
