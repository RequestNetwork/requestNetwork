import { IIdentity } from './identity-types';
import * as Extension from './extension-types';
import * as RequestLogic from './request-logic-types';
import { ExtensionTypes } from '.';

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

/** Parameters to create a request with reference based payment network */
export interface IReferenceBasedCreationParameters {
  paymentAddress?: string;
  refundAddress?: string;
  salt?: string;
}

/** Parameters to create a request with "fees in reference based" payment network */
export interface IFeeReferenceBasedCreationParameters extends IReferenceBasedCreationParameters {
  feeAddress?: string;
  feeAmount?: string;
}

/** Parameters to create a request with "any to erc20" payment network */
export interface IAnyToErc20CreationParameters extends IFeeReferenceBasedCreationParameters {
  network?: string;
  acceptedTokens?: string[];
  maxRateTimespan?: number;
}

/** Interface of the class to manage a payment network  */
export interface IPaymentNetworkDetection<TEventParameters = any> {
  getBalance(request: RequestLogic.IRequest): Promise<IBalanceWithEvents<TEventParameters>>;
  extension: ExtensionTypes.IExtension;
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
  balance: string | null;
  events: Array<IPaymentNetworkEvent<TEventParameters>>;
  error?: IBalanceError;
}

/** Interface for error encounter when getting the balance */
export interface IBalanceError {
  message: string;
  code: BALANCE_ERROR_CODE;
}

/** Balance error codes */
export enum BALANCE_ERROR_CODE {
  UNKNOWN,
  WRONG_EXTENSION,
  NETWORK_NOT_SUPPORTED,
  VERSION_NOT_SUPPORTED,
}

/** payment network event */
export interface IPaymentNetworkEvent<TEventParameters> {
  amount: string;
  name: EVENTS_NAMES;
  parameters?: TEventParameters;
  timestamp?: number;
}

/** payment network event names */
export enum EVENTS_NAMES {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

/** List of payment networks available (abstract the extensions type) */
export enum PAYMENT_NETWORK_ID {
  BITCOIN_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  TESTNET_BITCOIN_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  ERC20_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
  ERC20_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  ERC20_FEE_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
  ETH_INPUT_DATA = Extension.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  ETH_FEE_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
  NATIVE_TOKEN = Extension.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
  DECLARATIVE = Extension.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  ANY_TO_ERC20_PROXY = Extension.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  ANY_TO_ETH_PROXY = Extension.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
}

/** Generic info retriever interface */
export interface IPaymentNetworkInfoRetriever<
  TPaymentNetworkEvent extends IPaymentNetworkEvent<unknown>
> {
  getTransferEvents(): Promise<TPaymentNetworkEvent[]>;
}

/** Parameters for events of payments */
export interface IPaymentEventParameters {
  from?: string;
  to?: string;
  block?: number;
  txHash?: string;
  confirmations?: number;
}

export interface IFeePaymentEventParameters extends IPaymentEventParameters {
  feeAddress?: string;
  feeAmount?: string;
  tokenAddress?: string;
}

export interface IConversionPaymentEventParameters extends IFeePaymentEventParameters {
  feeAmountInCrypto?: string;
  amountInCrypto?: string;
}
////////////////////////////////////////////////////////////////////////////////////////
//// TODO to remove ?!
////////////////////////////////////////////////////////////////////////////////////////

/** Parameters for events of BTC payments */
export interface IBTCPaymentEventParameters {
  block?: number;
  txHash?: string;
}
/** BTC Payment Network Event */
export type BTCPaymentNetworkEvent = IPaymentNetworkEvent<IBTCPaymentEventParameters>;
/** BTC BalanceWithEvents */
export type BTCBalanceWithEvents = IBalanceWithEvents<IBTCPaymentEventParameters>;

/** Parameters for events of Declarative payments */
export interface IDeclarativePaymentEventParameters {
  note?: string;
  from?: IIdentity;
}
/** Declarative Payment Network Event */
export type DeclarativePaymentNetworkEvent = IPaymentNetworkEvent<IDeclarativePaymentEventParameters>;
/** Declarative BalanceWithEvents */
export type DeclarativeBalanceWithEvents = IBalanceWithEvents<IDeclarativePaymentEventParameters>;
