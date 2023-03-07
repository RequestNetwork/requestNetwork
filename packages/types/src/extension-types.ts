import * as ContentData from './extensions/content-data-types';
import * as PnAddressBased from './extensions/pn-any-address-based-types';
import * as PnAnyDeclarative from './extensions/pn-any-declarative-types';
import * as PnStreamReferenceBased from './extensions/pn-any-stream-reference-based-types';
import * as PnFeeReferenceBased from './extensions/pn-any-fee-reference-based-types';
import * as PnReferenceBased from './extensions/pn-any-reference-based-types';
import * as PnAnyToErc20 from './extensions/pn-any-to-erc20-types';
import * as PnAnyToEth from './extensions/pn-any-to-eth-types';
import * as PnAnyToAnyConversion from './extensions/pn-any-to-any-conversion-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

export {
  ContentData,
  PnAnyDeclarative,
  PnAddressBased,
  PnStreamReferenceBased,
  PnFeeReferenceBased,
  PnReferenceBased,
  PnAnyToErc20,
  PnAnyToEth,
  PnAnyToAnyConversion,
};

/** Extension interface is extended by the extensions implementation */
export interface IExtension<T = any> {
  extensionType: TYPE;
  extensionId: ID;
  currentVersion: string;
  applyActionToExtension: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: IAction<T>,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
    timestamp: number,
  ) => RequestLogic.IExtensionStates;
}

export type ApplyAction<T = any> = (
  extensionState: IState<T>,
  extensionAction: IAction<T>,
  requestState: RequestLogic.IRequest,
  actionSigner: Identity.IIdentity,
  timestamp: number,
) => IState<T>;

/** Extensions state in advanced logic */
export interface IState<T = any> {
  type: TYPE;
  id: ID;
  version: string;
  events: IEvent[];
  values: T;
}

/** State for payment networks extensions only */
export interface IPaymentNetworkState<T = any> extends IState<T> {
  id: PAYMENT_NETWORK_ID;
  type: TYPE.PAYMENT_NETWORK;
}

/** Creation action object */
export interface IAction<T = any> {
  action: string;
  id: ID;
  parameters?: T;
  version?: string;
}

/** extension event object */
export interface IEvent {
  name: string;
  parameters: any;
  timestamp: number;
  from?: Identity.IIdentity;
}

/**
 * Identification of extensions handled by this implementation.
 * */
export enum OTHER_ID {
  CONTENT_DATA = 'content-data',
}

export enum PAYMENT_NETWORK_ID {
  BITCOIN_ADDRESS_BASED = 'pn-bitcoin-address-based',
  TESTNET_BITCOIN_ADDRESS_BASED = 'pn-testnet-bitcoin-address-based',
  ERC20_ADDRESS_BASED = 'pn-erc20-address-based',
  ERC20_PROXY_CONTRACT = 'pn-erc20-proxy-contract',
  ERC20_FEE_PROXY_CONTRACT = 'pn-erc20-fee-proxy-contract',
  ERC777_STREAM = 'pn-erc777-stream',
  ETH_FEE_PROXY_CONTRACT = 'pn-eth-fee-proxy-contract',
  ETH_INPUT_DATA = 'pn-eth-input-data',
  NATIVE_TOKEN = 'pn-native-token',
  ANY_TO_NATIVE_TOKEN = 'pn-any-to-native-token',
  ANY_DECLARATIVE = 'pn-any-declarative',
  ANY_TO_ERC20_PROXY = 'pn-any-to-erc20-proxy',
  ANY_TO_ETH_PROXY = 'pn-any-to-eth-proxy',
  ERC20_TRANSFERABLE_RECEIVABLE = 'pn-erc20-transferable-receivable',
}

export const ID = {
  ...OTHER_ID,
  ...PAYMENT_NETWORK_ID,
};

type EnumToType<T> = T[keyof T];
export type ID = EnumToType<typeof ID>;

/** Type of extensions */
export enum TYPE {
  CONTENT_DATA = 'content-data',
  PAYMENT_NETWORK = 'payment-network',
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
}

export type SupportedActions = { [actionId: string]: ApplyAction };
