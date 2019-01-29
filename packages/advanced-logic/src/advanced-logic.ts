import {
  AdvancedLogic as Types,
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import contentData from './extensions/content-data';
import addressBasedBtc from './extensions/payment-network/bitcoin/address-based';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default class AdvancedLogic implements Types.IAdvancedLogic {
  /** Give access to the functions specific of the extensions supported */
  public extensions: any = {
    addressBasedBtc,
    contentData,
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
  public applyActionToExtensions(
    extensionsState: RequestLogicTypes.IRequestLogicExtensionStates,
    extensionAction: ExtensionTypes.IExtensionAction,
    requestState: RequestLogicTypes.IRequestLogicRequest,
    actionSigner: IdentityTypes.IIdentity,
  ): RequestLogicTypes.IRequestLogicExtensionStates {
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
}
