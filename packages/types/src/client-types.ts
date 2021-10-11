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
  paymentNetwork?: Payment.IPaymentNetworkCreateParameters;
  topics?: any[];
  contentData?: any;
  disablePaymentDetection?: boolean;
  disableEvents?: boolean;
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
  REQUEST_CLIENT_VERSION_HEADER: string;
  /** Maximum number of retries to attempt when http requests to the Node fail */
  HTTP_REQUEST_MAX_RETRY: number;
  /** Delay between retry in ms */
  HTTP_REQUEST_RETRY_DELAY: number;
  /** Maximum number of retries to get the confirmation of a persistTransaction */
  GET_CONFIRMATION_MAX_RETRY: number;
  /** Delay between retry in ms to get the confirmation of a persistTransaction */
  GET_CONFIRMATION_RETRY_DELAY: number;
  /** Delay to wait in ms before trying for the first time to get the confirmation of a persistTransaction */
  GET_CONFIRMATION_DEFER_DELAY: number;
}
