import { IIdentity } from './identity-types';
import * as RequestLogic from './request-logic-types';
import * as ExtensionTypes from './extension-types';
import { ICreationParameters } from './extensions/pn-any-declarative-types';
import { ICreationParameters as ICreationParametersAnyToAny } from './extensions/pn-any-to-any-conversion-types';

/** Interface for payment network extensions state and interpretation */
export interface IPaymentNetwork<TEventParameters = any> {
  paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID;
  extension: ExtensionTypes.IExtension;
  createExtensionsDataForCreation: (paymentNetworkCreationParameters: any) => Promise<any>;
  createExtensionsDataForAddRefundInformation: (parameters: any) => any;
  createExtensionsDataForAddPaymentInformation: (parameters: any) => any;
  getBalance(request: RequestLogic.IRequest): Promise<IBalanceWithEvents<TEventParameters>>;
}

/**
 * Interfaces for parameters to create payment extensions
 */

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
export interface IAnyToErc20CreationParameters extends ICreationParametersAnyToAny {
  acceptedTokens?: string[];
}

/**
 * Interface to create a payment network
 * @deprecated Use `PaymentNetworkCreateParameters` type instead
 * */
export interface IPaymentNetworkCreateParameters<T = any> {
  id: ExtensionTypes.PAYMENT_NETWORK_ID;
  parameters: T;
}

export type PaymentNetworkCreateParameters =
  | {
      id:
        | ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT
        | ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA
        | ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN;
      parameters: ExtensionTypes.PnReferenceBased.ICreationParameters;
    }
  | {
      id:
        | ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
        | ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT
        | ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE;
      parameters: ExtensionTypes.PnFeeReferenceBased.ICreationParameters;
    }
  | {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE;
      parameters: ExtensionTypes.PnAnyDeclarative.ICreationParameters;
    }
  | {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY;
      parameters: ExtensionTypes.PnAnyToErc20.ICreationParameters;
    }
  | {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY;
      parameters: ExtensionTypes.PnAnyToEth.ICreationParameters;
    }
  | {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN;
      parameters: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters;
    }
  | {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM;
      parameters: ExtensionTypes.PnStreamReferenceBased.ICreationParameters;
    }
  | {
      id:
        | ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED
        | ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED
        | ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED;
      parameters: ExtensionTypes.PnAddressBased.ICreationParameters;
    };

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
export interface IDeclarativePaymentEventParameters<TFrom = IIdentity> {
  txHash?: string;
  network?: string;
  note?: string;
  from?: TFrom;
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

export enum STREAM_EVENT_NAMES {
  START_STREAM = 'start_stream',
  END_STREAM = 'end_stream',
  UPDATE_STREAM = 'update_stream',
}
/** Parameters for events of ERC777 payments */
export interface IERC777PaymentEventParameters extends GenericEventParameters {
  from?: string;
  to: string;
  streamEventName?: STREAM_EVENT_NAMES;
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

export type ERC20PaymentNetworkEventParameters =
  | IERC20PaymentEventParameters
  | IERC20FeePaymentEventParameters;
/** ERC20 Payment Network Event */
export type ERC20PaymentNetworkEvent = IPaymentNetworkEvent<ERC20PaymentNetworkEventParameters>;

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
export interface IETHPaymentEventParameters extends GenericEventParameters {
  confirmations?: number;
  to?: string;
}
/** Parameters for events of ETH payments with fees */
export interface IETHFeePaymentEventParameters extends IETHPaymentEventParameters {
  feeAddress?: string;
  feeAmount?: string;
  feeAmountInCrypto?: string;
  amountInCrypto?: string;
}

export type ETHPaymentNetworkEventParameters =
  | IETHPaymentEventParameters
  | IETHFeePaymentEventParameters;
/** ETH Payment Network Event */
export type ETHPaymentNetworkEvent = IPaymentNetworkEvent<ETHPaymentNetworkEventParameters>;
/** ETH BalanceWithEvents */
export type ETHBalanceWithEvents = IBalanceWithEvents<ETHPaymentNetworkEventParameters>;

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
export interface IEscrowEventParameters extends Required<GenericEventParameters> {
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

// Types used by batch conversion smart contract
/** Input type used by batch conversion proxy to make
 *  an ERC20/ETH conversion or no-conversion payment */
export interface RequestDetail {
  recipient: string;
  requestAmount: string;
  path: string[];
  paymentReference: string;
  feeAmount: string;
  maxToSpend: string;
  maxRateTimespan: string;
}

/** Each paymentNetworkId is linked with a batch function */
export enum BATCH_PAYMENT_NETWORK_ID {
  BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
  BATCH_ERC20_PAYMENTS,
  BATCH_MULTI_ERC20_PAYMENTS,
  BATCH_ETH_PAYMENTS,
  BATCH_ETH_CONVERSION_PAYMENTS,
}

/** Input type used by batch conversion proxy to make an ERC20 & ETH,
 * and conversion & no-conversion payment through batchPayments */
export interface MetaDetail {
  paymentNetworkId: BATCH_PAYMENT_NETWORK_ID;
  requestDetails: RequestDetail[];
}
