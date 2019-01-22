import { Extension as ExtensionTypes, RequestLogic as Types } from '@requestnetwork/types';

import contentData from './extensions/content-data';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default {
  applyActionToExtensions,
  extensions: {
    contentData,
  },
};

/**
 * Applies the extension action to the request extensions state
 *
 * @param extensionsState IRequestLogicExtensionStates previous state of the extensions
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 *
 * @returns state of the extension
 */
function applyActionToExtensions(
  extensionsState: Types.IRequestLogicExtensionStates,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: Types.IRequestLogicRequest,
): Types.IRequestLogicExtensionStates {
  const id: ExtensionTypes.EXTENSION_ID = extensionAction.id;
  const type: ExtensionTypes.EXTENSION_TYPE = getExtensionTypeFromId(id);

  if (type === ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA) {
    return contentData.applyActionToExtension(extensionsState, extensionAction, requestState);
  }

  throw Error(`extension not recognized, id: ${id}`);
}

/**
 * Get the extension type from the extension id
 *
 * @param id EXTENSION_ID the extension id
 *
 * @returns extension type if extension id supported, undefined otherwise
 */
function getExtensionTypeFromId(id: ExtensionTypes.EXTENSION_ID): ExtensionTypes.EXTENSION_TYPE {
  return {
    [ExtensionTypes.EXTENSION_ID.CONTENT_DATA as string]: ExtensionTypes.EXTENSION_TYPE
      .CONTENT_DATA,
  }[id];
}
