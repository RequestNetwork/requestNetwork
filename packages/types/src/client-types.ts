import * as Identity from './identity-types';
import * as Payment from './payment-types';
import * as RequestLogic from './request-logic-types';

/** Restrict research to two timestamp */
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
  requestInfo: IRequestInfo;
  signer: Identity.IIdentity;
  paymentNetwork?: Payment.IPaymentNetworkCreateParameters;
  topics?: any[];
  contentData?: any;
  disablePaymentDetection?: boolean;
  disableEvents?: boolean;
}

/** Parameters to create a request. ICreateParameters with a more flexible currency */
export interface IRequestInfo extends Omit<RequestLogic.ICreateParameters, 'currency'> {
  currency: string | RequestLogic.ICurrency;
}

/** Events types risen by a request */
export interface IRequestEvents {
  confirmed: (requestData: IRequestDataWithEvents) => void;
  error: (error: string) => void;
}
