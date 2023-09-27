import * as Identity from './identity-types';
import * as Payment from './payment-types';
import * as RequestLogic from './request-logic-types';

/** Restrict research between two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** Interface request data */
export interface IRequestData extends Omit<RequestLogic.IRequest, 'currency'> {
  currency: string;
  meta: RequestLogic.IReturnMeta | null;
  balance: Payment.IBalanceWithEvents<any> | null;
  contentData: any;
  currencyInfo: RequestLogic.ICurrency;
  pending: RequestLogic.IPendingRequest | null;
  proofs: any[];
}

/** Interface request data with event emitter and subscriber */
export interface IRequestDataWithEvents extends IRequestData {
  on: <K extends keyof IRequestEvents>(event: K, listener: IRequestEvents[K]) => this;
  emit: <K extends keyof IRequestEvents>(
    event: K,
    ...args: Parameters<IRequestEvents[K]>
  ) => boolean;
}

/** Create request parameters */
export interface ICreateRequestParameters {
  requestInfo: RequestLogic.ICreateParameters | IRequestInfo;
  signer: Identity.IIdentity;
  paymentNetwork?: Payment.PaymentNetworkCreateParameters;
  topics?: any[];
  contentData?: any;
  disablePaymentDetection?: boolean;
  disableEvents?: boolean;
}

export interface ICreateRequestOptions {
  /**
   * Disable the request refresh after creation
   * Warning: the `balance` will be null.
   */
  skipRefresh?: boolean;
}

/** Parameters to create a request. ICreateParameters with a more flexible currency */
export interface IRequestInfo {
  currency: string | RequestLogic.ICurrency;
  expectedAmount: RequestLogic.Amount;
  payee?: Identity.IIdentity;
  payer?: Identity.IIdentity;
  extensionsData?: any[];
  timestamp?: number;
  nonce?: number;
}

/** Events types risen by a request */
export interface IRequestEvents {
  confirmed: (requestData: IRequestDataWithEvents) => void;
  error: (error: string) => void;
}

/** Configuration variables for http-data-access and http-metamask-data-access */
export interface IHttpDataAccessConfig {
  /** Name of the header containing the client version */
  requestClientVersionHeader: string;
  /** Maximum number of retries to attempt when http requests to the Node fail */
  httpRequestMaxRetry: number;
  /** Delay between retry in ms */
  httpRequestRetryDelay: number;
  /** Exponential backoff delay in ms when requests to the Node fail. */
  httpRequestExponentialBackoffDelay: number;
  /** Maximum exponential backoff delay in ms when requests to the Node fail. */
  httpRequestMaxExponentialBackoffDelay: number;
  /** Maximum number of retries to get the confirmation of a persistTransaction */
  getConfirmationMaxRetry: number;
  /** Delay between retry in ms to get the confirmation of a persistTransaction */
  getConfirmationRetryDelay: number;
  /** Exponential backoff delay in ms to get the confirmation of a persistTransaction */
  getConfirmationExponentialBackoffDelay: number;
  /** Maximum exponential backoff delay in ms to get the confirmation of a persistTransaction */
  getConfirmationMaxExponentialBackoffDelay: number;
  /** Delay to wait in ms before trying for the first time to get the confirmation of a persistTransaction */
  getConfirmationDeferDelay: number;
}
