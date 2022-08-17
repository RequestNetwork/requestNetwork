import { IIdentity } from './identity-types';
import * as Extension from './extension-types';
import * as RequestLogic from './request-logic-types';
import { ICreationParameters } from './extensions/pn-any-declarative-types';

/** List of payment networks available (abstract the extensions type) */
export enum PAYMENT_NETWORK_ID {
  BITCOIN_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  TESTNET_BITCOIN_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  ERC20_ADDRESS_BASED = Extension.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
  ERC20_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  ERC20_FEE_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
  ERC777_STREAM = Extension.ID.PAYMENT_NETWORK_ERC777_STREAM,
  ETH_INPUT_DATA = Extension.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  ETH_FEE_PROXY_CONTRACT = Extension.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
  NATIVE_TOKEN = Extension.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
  DECLARATIVE = Extension.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  ANY_TO_ERC20_PROXY = Extension.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  ANY_TO_ETH_PROXY = Extension.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
}
/** Interface for payment network extensions state and interpretation */
export interface IPaymentNetwork<TEventParameters = any> {
  paymentNetworkId: PAYMENT_NETWORK_ID;
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => Promise<any>;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogic.IRequest): Promise<IBalanceWithEvents<TEventParameters>>;
}

/**
 * Interfaces for parameters to create payment extensions
 */

/** Interface to create a payment network  */
export interface IPaymentNetworkCreateParameters<T = any> {
  id: PAYMENT_NETWORK_ID;
  parameters: T;
}

/** Parameters to create a request with reference based payment network */
export interface IReferenceBasedCreationParameters extends ICreationParameters {
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

/**
 * Interfaces for balance and events
 */

/** Interface for balances and the events link to the payments and refund */
export interface IBalanceWithEvents<TEventParameters = any> {
  balance: string | null;
  events: Array<IPaymentNetworkEvent<TEventParameters>>;
  error?: IBalanceError;
  escrowEvents?: Array<EscrowNetworkEvent>;
}

/** Interface for error encounter when getting the balance */
export interface IBalanceError {
  message: string;
  code: BALANCE_ERROR_CODE;
}

/** payment network event names */
export enum EVENTS_NAMES {
  PAYMENT = 'payment',
  REFUND = 'refund',
  ESCROW = 'escrow',
}

export enum ESCROW_EVENTS_NAMES {
  PAID_ESCROW = 'paidEscrow',
  PAID_ISSUER = 'paidIssuer',
  INITIATE_EMERGENCY_CLAIM = 'initiateEmergencyClaim',
  REVERT_EMERGENCY_CLAIM = 'revertEmergencyClaim',
  FREEZE_ESCROW = 'freezeEscrow',
}

/** Balance error codes */
export enum BALANCE_ERROR_CODE {
  UNKNOWN,
  WRONG_EXTENSION,
  NETWORK_NOT_SUPPORTED,
  VERSION_NOT_SUPPORTED,
}

export interface IPaymentNetworkBaseEvent<TEventNames = EVENTS_NAMES> {
  name: TEventNames;
  timestamp?: number;
}

/** payment network event */
export interface IPaymentNetworkEvent<TEventParameters, TEventNames = EVENTS_NAMES>
  extends IPaymentNetworkBaseEvent<TEventNames> {
  amount: string;
  parameters?: TEventParameters;
}

/**
 * Declarative balance and events for detection-based payment networks
 */

/** Parameters for events of Declarative payments */
export interface IDeclarativePaymentEventParameters {
  txHash?: string;
  network?: string;
  note?: string;
  from?: IIdentity;
}
/** Declarative Payment Network Event */
export type DeclarativePaymentNetworkEvent =
  IPaymentNetworkEvent<IDeclarativePaymentEventParameters>;
/** Declarative BalanceWithEvents */
export type DeclarativeBalanceWithEvents = IBalanceWithEvents<IDeclarativePaymentEventParameters>;

/** Generic info retriever interface without transfers */
export interface IPaymentNetworkBaseInfoRetriever<
  TPaymentNetworkEvent extends IPaymentNetworkBaseEvent<TEventNames>,
  TEventNames = EVENTS_NAMES,
> {
  getAllContractEvents(): Promise<TPaymentNetworkEvent[]>;
}
/**
 * ERC777 networks and events
 */

/** Parameters for events of ERC777 payments */
export interface IERC777PaymentEventParameters {
  from?: string;
  to: string;
  block?: number;
  txHash?: string;
}

/** ERC777 Payment Network Event */
export type ERC777PaymentNetworkEvent = IPaymentNetworkEvent<IERC777PaymentEventParameters>;
/** ERC777 BalanceWithEvents */
export type ERC777BalanceWithEvents = IBalanceWithEvents<IERC777PaymentEventParameters>;

/**
 * ERC20 networks and events
 */

/** Parameters for events of ERC20 payments */
export interface GenericEventParameters {
  block?: number;
  txHash?: string;
}

export interface EscrowEventParameters extends GenericEventParameters {
  from?: string;
  to?: string;
}

/** Parameters for events of ERC20 payments */
export interface IERC20PaymentEventParameters extends GenericEventParameters {
  from?: string;
  to: string;
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

/**
 * Conversion-related events
 */

export type ConversionPaymentNetworkEventParameters =
  | IERC20PaymentEventParameters
  | IERC20FeePaymentEventParameters
  | IETHPaymentEventParameters
  | IETHFeePaymentEventParameters;
export type ConversionPaymentNetworkEvent =
  IPaymentNetworkEvent<ConversionPaymentNetworkEventParameters>;

/**
 * ETH and native token balance and events
 */

/** Parameters for events of ETH payments */
export interface IETHPaymentEventParameters {
  block?: number;
  confirmations?: number;
  txHash?: string;
}
/** Parameters for events of ETH payments with fees */
export interface IETHFeePaymentEventParameters extends IETHPaymentEventParameters {
  feeAddress?: string;
  feeAmount?: string;
  feeAmountInCrypto?: string;
  amountInCrypto?: string;
}

/** ETH Payment Network Event */
export type ETHPaymentNetworkEvent = IPaymentNetworkEvent<
  IETHPaymentEventParameters | IETHFeePaymentEventParameters
>;
/** ETH BalanceWithEvents */
export type ETHBalanceWithEvents = IBalanceWithEvents<
  IETHPaymentEventParameters | IETHFeePaymentEventParameters
>;

/**
 * Bitcoin provider and events
 */

/** Interface of the class to manage the bitcoin provider API */
export interface IBitcoinDetectionProvider {
  getAddressBalanceWithEvents: (
    bitcoinNetworkId: number,
    address: string,
    eventName: EVENTS_NAMES,
  ) => Promise<IBalanceWithEvents<IBTCPaymentEventParameters>>;
}

/** Parameters for events of BTC payments */
export interface IBTCPaymentEventParameters {
  block?: number;
  txHash?: string;
}
/** BTC Payment Network Event */
export type BTCPaymentNetworkEvent = IPaymentNetworkEvent<IBTCPaymentEventParameters>;
/** BTC BalanceWithEvents */
export type BTCBalanceWithEvents = IBalanceWithEvents<IBTCPaymentEventParameters>;

/** Parameters for escrow events from EscrowERC20 contract state changes */
export interface IEscrowEventParameters {
  block: number;
  txHash: string;
  from?: string;
  to?: string;
  eventName: string;
}
/** Escrow events that change the state of the Escrow */
export type EscrowEvents = IEscrowEventParameters;

export enum ESCROW_STATE {
  PAID_ESCROW = 'paidEscrow',
  IN_FROZEN = 'frozen',
  IN_EMERGENCY = 'emergency',
  PAID_ISSUER = 'paidIssuer',
}

/** Parameters that describe the current escrow state */
export interface IEscrowParameters {
  creationBlock: number;
  creationTimestamp: number;
  escrowState: string;
  tokenAddress: string;
  amount: string;
  from: string;
  to: string;
  feeAmount: string;
  feeAddress: string;
}
/** Represents the current state of an escrow instance */
export type EscrowData = IEscrowParameters;

export interface IEscrowChainData {
  tokenAddress: string;
  payee: string;
  payer: string;
  amount: number;
  unlockDate: number;
  emergencyClaimDate: number;
  emergencyState: boolean;
  isFrozen: boolean;
}
/** Represents the escrow data stored onchain */
export type EscrowChainData = IEscrowChainData;

/** escrow payment network event */
export interface IPaymentNetworkEscrowEvent<TEventParameters, TEventNames = EVENTS_NAMES>
  extends IPaymentNetworkBaseEvent<TEventNames> {
  parameters?: TEventParameters;
}

export type EscrowNetworkEvent = IPaymentNetworkEscrowEvent<IEscrowEventParameters, EVENTS_NAMES>;

export type AllNetworkEvents<TMyEventParameters> = {
  paymentEvents: IPaymentNetworkEvent<TMyEventParameters>[];
  escrowEvents?: EscrowNetworkEvent[];
};

export type AllNetworkRetrieverEvents<TPaymentNetworkEventType> = {
  paymentEvents: TPaymentNetworkEventType[];
  escrowEvents?: EscrowNetworkEvent[];
};
