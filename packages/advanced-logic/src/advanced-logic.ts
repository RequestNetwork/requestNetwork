import {
  AdvancedLogic as Types,
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import contentData from './extensions/content-data';
import addressBasedBtc from './extensions/payment-network/bitcoin/mainnet-address-based';
import addressBasedTestnetBtc from './extensions/payment-network/bitcoin/testnet-address-based';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default class AdvancedLogic implements Types.IAdvancedLogic {
  /** Give access to the functions specific of the extensions supported */
  public extensions: any = {
    addressBasedBtc,
    addressBasedTestnetBtc,
    contentData,
  };

  /**
   * Applies the extension action to the request extensions state
   *
   * @param extensionsState IExtensionStates previous state of the extensions
   * @param extensionAction IAction action to apply
   * @param requestState IRequest request state read-only
   * @param actionSigner IIdentity identity of the signer
   *
   * @returns state of the extension
   */
  public applyActionToExtensions(
    extensionsState: RequestLogicTypes.IExtensionStates,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
  ): RequestLogicTypes.IExtensionStates {
    const id: ExtensionTypes.ID = extensionAction.id;

    if (id === ExtensionTypes.ID.CONTENT_DATA) {
      return contentData.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED) {
      return addressBasedBtc.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED) {
      return addressBasedTestnetBtc.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
      );
    }

    throw Error(`extension not recognized, id: ${id}`);
  }
}
