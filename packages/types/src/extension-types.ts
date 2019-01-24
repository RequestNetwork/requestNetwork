import * as ContentData from './extensions/content-data-types';
import * as PnBitcoinAddressBased from './extensions/pn-bitcoin-address-based-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

export { ContentData, PnBitcoinAddressBased };

/** Extension interface is extended by the extensions implementation */
export interface IExtension {
  applyActionToExtension: (
    extensionsState: RequestLogic.IRequestLogicExtensionStates,
    extensionAction: IExtensionAction,
    requestState: RequestLogic.IRequestLogicRequest,
    actionSigner: Identity.IIdentity,
  ) => RequestLogic.IRequestLogicExtensionStates;
}

/** Extensions state in advanced logic */
export interface IExtensionState {
  type: EXTENSION_TYPE;
  id: EXTENSION_ID;
  version: string;
  events: IExtensionEvent[];
  values: any;
}

/** Creation action object */
export interface IExtensionAction {
  action: string;
  id: EXTENSION_ID;
  parameters?: any;
  version?: string;
}

/** extension event object */
export interface IExtensionEvent {
  name: string;
  parameters: any;
}

/** Identification of extensions handled by this implementation */
export enum EXTENSION_ID {
  CONTENT_DATA = 'content-data',
  PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED = 'pn-bitcoin-address-based',
}

/** Type of extensions */
export enum EXTENSION_TYPE {
  CONTENT_DATA = 'content-data',
  PAYMENT_NETWORK = 'payment-network',
}
