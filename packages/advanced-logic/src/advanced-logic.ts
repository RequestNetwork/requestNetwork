import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
} from '@requestnetwork/types';

import contentData from './extensions/content-data';
import addressBasedBtc from './extensions/payment-network/bitcoin/address-based';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default {
  applyActionToExtensions,
  extensions: {
    addressBasedBtc,
    contentData,
  },
};

/**
 * Applies the extension action to the request extensions state
 *
 * @param extensionsState IRequestLogicExtensionStates previous state of the extensions
 * @param extensionAction IExtensionAction action to apply
 * @param requestState IRequestLogicRequest request state read-only
 * @param actionSigner IIdentity identity of the signer
 *
 * @returns state of the extension
 */
function applyActionToExtensions(
  extensionsState: Types.IRequestLogicExtensionStates,
  extensionAction: ExtensionTypes.IExtensionAction,
  requestState: Types.IRequestLogicRequest,
  actionSigner: IdentityTypes.IIdentity,
): Types.IRequestLogicExtensionStates {
  const id: ExtensionTypes.EXTENSION_ID = extensionAction.id;

  if (id === ExtensionTypes.EXTENSION_ID.CONTENT_DATA) {
    return contentData.applyActionToExtension(
      extensionsState,
      extensionAction,
      requestState,
      actionSigner,
    );
  }
  if (id === ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED) {
    return addressBasedBtc.applyActionToExtension(
      extensionsState,
      extensionAction,
      requestState,
      actionSigner,
    );
  }

  throw Error(`extension not recognized, id: ${id}`);
}
