import { EnumToType } from './shared';
import * as RequestLogic from './request-logic-types';

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
export interface IPaymentNetwork<TEventParameters = any> {
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => Promise<any>;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogic.IRequest): Promise<IBalanceWithEvents<TEventParameters>>;
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

export const EVENTS_NAMES = {
  PAYMENT: 'payment',
  REFUND: 'refund',
} as const;
/** payment network event names */
export type EVENTS_NAMES = 'payment' | 'refund';

export const PAYMENT_NETWORK_ID = {
  BITCOIN_ADDRESS_BASED: 'pn-bitcoin-address-based',
  TESTNET_BITCOIN_ADDRESS_BASED: 'pn-testnet-bitcoin-address-based',
  ERC20_ADDRESS_BASED: 'pn-erc20-address-based',
  ERC20_PROXY_CONTRACT: 'pn-erc20-proxy-contract',
  ERC20_FEE_PROXY_CONTRACT: 'pn-erc20-fee-proxy-contract',
  ETH_INPUT_DATA: 'pn-eth-input-data',
  DECLARATIVE: 'pn-any-declarative',
  ANY_TO_ERC20_PROXY: 'pn-any-to-erc20-proxy',
} as const;

/** List of payment networks available (abstract the extensions type) */
export type PAYMENT_NETWORK_ID = EnumToType<typeof PAYMENT_NETWORK_ID>;

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

/** Parameters for events of ERC20 payments with fees */
export interface IERC20FeePaymentEventParameters extends IERC20PaymentEventParameters {
  feeAddress?: string;
  feeAmount?: string;
  feeAmountInCrypto?: string;
  amountInCrypto?: string;
  tokenAddress?: string;
}

/** ERC20 Payment Network Event */
export type ERC20PaymentNetworkEvent = IPaymentNetworkEvent<
  IERC20PaymentEventParameters | IERC20FeePaymentEventParameters
>;
/** ERC20 BalanceWithEvents */
export type ERC20BalanceWithEvents = IBalanceWithEvents<IERC20PaymentEventParameters>;

/** Parameters for events of ETH payments */
export interface IETHPaymentEventParameters {
  block?: number;
  confirmations?: number;
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
export type DeclarativePaymentNetworkEvent = IPaymentNetworkEvent<IDeclarativePaymentEventParameters>;
/** Declarative BalanceWithEvents */
export type DeclarativeBalanceWithEvents = IBalanceWithEvents<IDeclarativePaymentEventParameters>;
