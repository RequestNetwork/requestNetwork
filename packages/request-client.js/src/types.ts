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
export interface IRequestData extends Omit<RequestLogicTypes.IRequest, 'currency'> {
  currency: string;
  meta: RequestLogicTypes.IReturnMeta | null;
  balance: IBalanceWithEvents<any> | null;
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

/** Parameters to create a ETH input data request */
export interface IEthInputDataCreationParameters
  extends ExtensionTypes.PnAddressBased.ICreationParameters {
  salt?: string;
}

/** Interface of the class to manage a payment network  */
export interface IPaymentNetwork<TEventParameters = any> {
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => any;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogicTypes.IRequest): Promise<IBalanceWithEvents<TEventParameters>>;
}

/** Interface of the class to manage the bitcoin provider API */
export interface IBitcoinDetectionProvider {
  getAddressBalanceWithEvents: (
    bitcoinNetworkId: number,
    address: string,
    eventName: EVENTS_NAMES,
  ) => Promise<IBalanceWithEvents<IBTCPaymentEventParameters>>;
}

/** Interface for balances and the events link to the payments and refund */
export interface IBalanceWithEvents<TEventParameters = any> {
  balance: string;
  events: Array<IPaymentNetworkEvent<TEventParameters>>;
}

/** payment network event */
export interface IPaymentNetworkEvent<TEventParameters> {
  amount: string;
  block?: number;
  name: EVENTS_NAMES;
  parameters?: TEventParameters;
  timestamp?: number;
  txHash?: string;
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
  ETH_INPUT_DATA = ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  DECLARATIVE = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
}

/** Generic info retriever interface */
export interface IPaymentNetworkInfoRetriever<
  TPaymentNetworkEvent extends IPaymentNetworkEvent<{}>
> {
  getTransferEvents(): Promise<TPaymentNetworkEvent[]>;
}

/** Parameters for events of ERC20 payments */
export interface IERC20PaymentEventParameters {
  from: string;
  to: string;
}

/** ERC20 Payment Network Event */
export type ERC20PaymentNetworkEvent = IPaymentNetworkEvent<IERC20PaymentEventParameters>;
/** ERC20 BalanceWithEvents */
export type ERC20BalanceWithEvents = IBalanceWithEvents<IERC20PaymentEventParameters>;

/** Parameters for events of ETH payments */
export interface IETHPaymentEventParameters {
  confirmations: number;
}
/** ETH Payment Network Event */
export type ETHPaymentNetworkEvent = IPaymentNetworkEvent<IETHPaymentEventParameters>;
/** ETH BalanceWithEvents */
export type ETHBalanceWithEvents = IBalanceWithEvents<IETHPaymentEventParameters>;

/** Parameters for events of BTC payments */
/** BTC Payment Network Event */
export type BTCPaymentNetworkEvent = IPaymentNetworkEvent<IBTCPaymentEventParameters>;
/** BTC BalanceWithEvents */
export type BTCBalanceWithEvents = IBalanceWithEvents<IBTCPaymentEventParameters>;

/** Parameters for events of Declarative payments */
export interface IDeclarativePaymentEventParameters {
  note?: string;
}
/** Declarative Payment Network Event */
export type DeclarativePaymentNetworkEvent = IPaymentNetworkEvent<
  IDeclarativePaymentEventParameters
>;
/** Declarative BalanceWithEvents */
export type DeclarativeBalanceWithEvents = IBalanceWithEvents<IDeclarativePaymentEventParameters>;
