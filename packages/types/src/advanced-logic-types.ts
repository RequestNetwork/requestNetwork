import * as Extension from './extension-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

/** Advanced Logic layer */
export interface IAdvancedLogic {
  applyActionToExtensions: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: Extension.IExtensionAction,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
  ) => RequestLogic.IExtensionStates;
  extensions: any;
}

/** Creation extension parameters */
export interface IAdvancedLogicExtensionCreation {
  id: Extension.EXTENSION_ID;
  parameters?: any;
}

/** Update extension parameters */
export interface IAdvancedLogicExtensionUpdate {
  id: Extension.EXTENSION_ID;
  action: string;
  parameters?: any;
}
