import * as Extension from './extension-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

/** Advanced Logic layer */
export interface IAdvancedLogic {
  applyActionToExtensions: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: Extension.IAction,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
    timestamp: number,
  ) => RequestLogic.IExtensionStates;
  extensions: any;
}

/** Creation extension parameters */
export interface IExtensionCreation {
  id: Extension.ID;
  parameters?: any;
}

/** Update extension parameters */
export interface IExtensionUpdate {
  id: Extension.ID;
  action: string;
  parameters?: any;
}
