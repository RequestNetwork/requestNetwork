import * as ContentData from './extensions/content-data-types';
import * as PnAddressBased from './extensions/pn-any-address-based-types';
import * as PnAnyDeclarative from './extensions/pn-any-declarative-types';
import * as PnFeeReferenceBased from './extensions/pn-any-fee-reference-based-types';
import * as PnReferenceBased from './extensions/pn-any-reference-based-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

export { ContentData, PnAnyDeclarative, PnAddressBased, PnFeeReferenceBased, PnReferenceBased };

/** Extension interface is extended by the extensions implementation */
export interface IExtension {
  applyActionToExtension: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: IAction,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
    timestamp: number,
  ) => RequestLogic.IExtensionStates;
}

/** Extensions state in advanced logic */
export interface IState {
  type: TYPE;
  id: ID;
  version: string;
  events: IEvent[];
  values: any;
}

/** Creation action object */
export interface IAction {
  action: string;
  id: ID;
  parameters?: any;
  version?: string;
}

/** extension event object */
export interface IEvent {
  name: string;
  parameters: any;
  timestamp: number;
}

/** Identification of extensions handled by this implementation */
export enum ID {
  CONTENT_DATA = 'content-data',
  PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED = 'pn-bitcoin-address-based',
  PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED = 'pn-testnet-bitcoin-address-based',
  PAYMENT_NETWORK_ERC20_ADDRESS_BASED = 'pn-erc20-address-based',
  PAYMENT_NETWORK_ERC20_PROXY_CONTRACT = 'pn-erc20-proxy-contract',
  PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT = 'pn-erc20-fee-proxy-contract',
  PAYMENT_NETWORK_ETH_INPUT_DATA = 'pn-eth-input-data',
  PAYMENT_NETWORK_ANY_DECLARATIVE = 'pn-any-declarative',
}

/** Type of extensions */
export enum TYPE {
  CONTENT_DATA = 'content-data',
  PAYMENT_NETWORK = 'payment-network',
}
