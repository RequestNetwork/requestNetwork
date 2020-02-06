import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CURRENCY } from '@requestnetwork/types/src/request-logic-types';

/** List of payment networks available (abstract the extensions type) */
export enum PAYMENT_NETWORK_ID {
  BITCOIN_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  TESTNET_BITCOIN_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  ERC20_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
  ERC20_PROXY_CONTRACT = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
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
  from?: string;
  to: string;
  block?: number;
  txHash?: string;
}

/** ERC20 Payment Network Event */
export type ERC20PaymentNetworkEvent = IPaymentNetworkEvent<IERC20PaymentEventParameters>;
/** ERC20 BalanceWithEvents */
export type ERC20BalanceWithEvents = IBalanceWithEvents<IERC20PaymentEventParameters>;

/** Parameters for events of ETH payments */
export interface IETHPaymentEventParameters {
  block?: number;
  confirmations: number;
  txHash?: string;
}
/** ETH Payment Network Event */
export type ETHPaymentNetworkEvent = IPaymentNetworkEvent<IETHPaymentEventParameters>;
/** ETH BalanceWithEvents */
export type ETHBalanceWithEvents = IBalanceWithEvents<IETHPaymentEventParameters>;

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
}
/** Declarative Payment Network Event */
export type DeclarativePaymentNetworkEvent = IPaymentNetworkEvent<
  IDeclarativePaymentEventParameters
>;
/** Declarative BalanceWithEvents */
export type DeclarativeBalanceWithEvents = IBalanceWithEvents<IDeclarativePaymentEventParameters>;

/** Object interface to list the payment network id and its module by currency */
export type SupportedPaymentNetworkByCurrency = Record<CURRENCY, SupportedPaymentNetworkByNetwork>;

/** Object interface to list the payment network module by network */
export type SupportedPaymentNetworkByNetwork = Record<string, PaymentNetworkModuleByType>;

/** Object interface to list the payment network module by id */
export type PaymentNetworkModuleByType = Record<string, any>;

/** Interface to create a payment network  */
export interface IPaymentNetworkCreateParameters<TEventParameters> {
  id: PAYMENT_NETWORK_ID;
  parameters: TEventParameters;
}

/** Parameters to create a request with reference based payment network */
export interface IReferenceBasedCreationParameters {
  paymentAddress?: string;
  refundAddress?: string;
  salt?: string;
}

/** Interface of the class to manage a payment network  */
export interface IPaymentNetwork<TEventParameters> {
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
export interface IBalanceWithEvents<TEventParameters> {
  balance: string;
  events: Array<IPaymentNetworkEvent<TEventParameters>>;
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
