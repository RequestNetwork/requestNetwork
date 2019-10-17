import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/**
 * Implementation of the content data extension
 */
const contentData: ExtensionTypes.ContentData.IContentData = {
  applyActionToExtension,
  createCreationAction,
};
export default contentData;

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
  creationParameters: ExtensionTypes.ContentData.ICreationParameters,
): ExtensionTypes.IAction {
  if (!creationParameters.content) {
    throw Error('No content has been given for the extension content-data');
  }

  return {
    action: ExtensionTypes.ContentData.ACTION.CREATE,
    id: ExtensionTypes.ID.CONTENT_DATA,
    parameters: creationParameters,
    version: CURRENT_VERSION,
  };
}

/**
 * Applies the extension action to the request
 * Is called to interpret the extensions data when applying the transaction
 *
 * @param extensionsState IExtensionStates previous state of the extensions
 * @param extensionAction IAction action to apply
 * @param requestState IRequest request state read-only
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  extensionsState: RequestLogicTypes.IExtensionStates,
  extensionAction: ExtensionTypes.IAction,
  requestState: RequestLogicTypes.IRequest,
): RequestLogicTypes.IExtensionStates {
  if (extensionAction.action !== ExtensionTypes.ContentData.ACTION.CREATE) {
    throw Error(`Unknown action: ${extensionAction.action}`);
  }

  if (requestState.extensions[ExtensionTypes.ID.CONTENT_DATA]) {
    throw Error(`This extension has already been created`);
  }

  if (!extensionAction.parameters.content) {
    throw Error('No content has been given for the extension content-data');
  }

  // Deep copy to not mutate the input parameter
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  copiedExtensionState[ExtensionTypes.ID.CONTENT_DATA] = {
    events: [],
    id: ExtensionTypes.ID.CONTENT_DATA,
    type: ExtensionTypes.TYPE.CONTENT_DATA,
    values: { content: extensionAction.parameters.content },
    version: CURRENT_VERSION,
  };

  return copiedExtensionState;
}
