import {
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/**
 * Implementation of the content data extension
 */
const contentDataManager: ExtensionTypes.ContentData.IContentDataManager = {
  applyActionToExtension,
  createCreationAction,
};
export default contentDataManager;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData to create the extension content-data
 * Should be called to create the extensionsData of a request
 *
 * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be store in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.ContentData.IContentDataCreationParameters,
): ExtensionTypes.IExtensionAction {
  if (!creationParameters.content) {
    throw Error('No content has been given for the extension content-data');
  }

  return {
    action: ExtensionTypes.ContentData.CONTENT_DATA_ACTION.CREATE,
    id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
    parameters: creationParameters,
    version: CURRENT_VERSION,
  };
}

/**
 * Applies the extension action to the request
 * Is called to interpret the extensions data when applying the transaction
 *
 * @param extensionsState IRequestLogicExtensionStates previous state of the extensions
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  extensionsState: RequestLogicTypes.IRequestLogicExtensionStates,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: RequestLogicTypes.IRequestLogicRequest,
): RequestLogicTypes.IRequestLogicExtensionStates {
  if (extensionAction.action !== ExtensionTypes.ContentData.CONTENT_DATA_ACTION.CREATE) {
    throw Error(`Unknown action: ${extensionAction.action}`);
  }

  if (requestState.extensions[ExtensionTypes.EXTENSION_ID.CONTENT_DATA]) {
    throw Error(`This extension have already been created`);
  }

  if (!extensionAction.parameters.content) {
    throw Error('No content has been given for the extension content-data');
  }

  // Deep copy to not mutate the input parameter
  const copiedExtensionState: RequestLogicTypes.IRequestLogicExtensionStates = Utils.deepCopy(
    extensionsState,
  );

  copiedExtensionState[ExtensionTypes.EXTENSION_ID.CONTENT_DATA] = {
    events: [],
    id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
    type: ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA,
    values: { content: extensionAction.parameters.content },
    version: CURRENT_VERSION,
  };

  return copiedExtensionState;
}
