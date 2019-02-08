import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

/** Interface request data */
export interface IRequestData {
  requestInfo: RequestLogicTypes.IRequestLogicRequest | null;
  meta: RequestLogicTypes.IRequestLogicReturnMeta | null;
  balance: IBalanceWithEvents | null;
}

/** Create request parameters */
export interface ICreateRequestParameters {
  requestInfo: RequestLogicTypes.IRequestLogicCreateParameters;
  signer: IdentityTypes.IIdentity;
  paymentNetwork?: IPaymentNetworkCreateParameters;
  topics?: string[];
}

/** Object interface to list the payment network id and its module by currency */
export interface ISupportedPaymentNetworkByCurrency {
  [currency: string]: IPaymentNetworkModuleByType;
}

/** Object interface to list the payment network module by id */
export interface IPaymentNetworkModuleByType {
  [type: string]: any;
}

/** Interface to create a payment network  */
export interface IPaymentNetworkCreateParameters {
  id: ExtensionTypes.EXTENSION_ID;
  parameters: any;
}

/** Interface of the class to manage a payment network  */
export interface IPaymentNetworkManager {
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => any;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogicTypes.IRequestLogicRequest): Promise<IBalanceWithEvents>;
}

/** Interface for balances and the events link to the payments and refund */
export interface IBalanceWithEvents {
  balance: string;
  events: IPaymentNetworkEvent[];
}

/** payment network event */
export interface IPaymentNetworkEvent {
  name: EVENTS_NAMES;
  parameters?: any;
}

/** payment network event names */
export enum EVENTS_NAMES {
  PAYMENT = 'payment',
  REFUND = 'refund',
}
