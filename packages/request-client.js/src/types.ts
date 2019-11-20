import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

// Export all the types to avoid the users to import them beside the present module
export {
  AdvancedLogicTypes as AdvancedLogic,
  LogTypes as Log,
  DecryptionProviderTypes as DecryptionProvider,
  ExtensionTypes as Extension,
  EncryptionTypes as Encryption,
  RequestLogicTypes as RequestLogic,
  DataAccessTypes as DataAccess,
  SignatureTypes as Signature,
  SignatureProviderTypes as SignatureProvider,
  IdentityTypes as Identity,
  StorageTypes as Storage,
  TransactionTypes as Transaction,
} from '@requestnetwork/types';

/** Restrict research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** Interface request data */
// TODO: when upgrading typescript to 3.5+ we should use Omit instead of Pick+Exclude
export interface IRequestData
  extends Pick<RequestLogicTypes.IRequest, Exclude<keyof RequestLogicTypes.IRequest, 'currency'>> {
  currency: string;
  meta: RequestLogicTypes.IReturnMeta | null;
  balance: IBalanceWithEvents | null;
  contentData: any;
  currencyInfo: RequestLogicTypes.ICurrency;
}

/** Create request parameters */
export interface ICreateRequestParameters {
  requestInfo: RequestLogicTypes.ICreateParameters | IRequestInfo;
  signer: IdentityTypes.IIdentity;
  paymentNetwork?: IPaymentNetworkCreateParameters;
  topics?: string[];
  contentData?: any;
}

/** Parameters to create a request. ICreateParameters with a more flexible currency */
export interface IRequestInfo {
  currency: string | RequestLogicTypes.ICurrency;
  expectedAmount: RequestLogicTypes.Amount;
  payee?: IdentityTypes.IIdentity;
  payer?: IdentityTypes.IIdentity;
  extensionsData?: any[];
  timestamp?: number;
  nonce?: number;
}

/** Object interface to list the payment network id and its module by currency */
export interface ISupportedPaymentNetworkByCurrency {
  [currency: string]: ISupportedPaymentNetworkByNetwork;
}

/** Object interface to list the payment network module by network */
export interface ISupportedPaymentNetworkByNetwork {
  [network: string]: IPaymentNetworkModuleByType;
}

/** Object interface to list the payment network module by id */
export interface IPaymentNetworkModuleByType {
  [type: string]: any;
}

/** Interface to create a payment network  */
export interface IPaymentNetworkCreateParameters {
  id: PAYMENT_NETWORK_ID;
  parameters: any;
}

/** Interface of the class to manage a payment network  */
export interface IPaymentNetwork {
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => any;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogicTypes.IRequest): Promise<IBalanceWithEvents>;
}

/** Interface of the class to manage the bitcoin provider API */
export interface IBitcoinDetectionProvider {
  getAddressBalanceWithEvents: (
    bitcoinNetworkId: number,
    address: string,
    eventName: EVENTS_NAMES,
  ) => Promise<IBalanceWithEvents>;
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

/** List of payment networks available (abstract the extensions type) */
export enum PAYMENT_NETWORK_ID {
  BITCOIN_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  TESTNET_BITCOIN_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  ERC20_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
  DECLARATIVE = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
}
