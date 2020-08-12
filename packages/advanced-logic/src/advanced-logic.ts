import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import contentData from './extensions/content-data';
import addressBasedBtc from './extensions/payment-network/bitcoin/mainnet-address-based';
import addressBasedTestnetBtc from './extensions/payment-network/bitcoin/testnet-address-based';
import declarative from './extensions/payment-network/declarative';
import addressBasedErc20 from './extensions/payment-network/erc20/address-based';
import feeProxyContractErc20 from './extensions/payment-network/erc20/fee-proxy-contract';
import proxyContractErc20 from './extensions/payment-network/erc20/proxy-contract';
import ethereumInputData from './extensions/payment-network/ethereum/input-data';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default class AdvancedLogic implements AdvancedLogicTypes.IAdvancedLogic {
  /** Give access to the functions specific of the extensions supported */
  public extensions: any = {
    addressBasedBtc,
    addressBasedErc20,
    addressBasedTestnetBtc,
    contentData,
    declarative,
    ethereumInputData,
    feeProxyContractErc20,
    proxyContractErc20,
  };

  /**
   * Applies the extension action to the request extensions state
   *
   * @param extensionsState IExtensionStates previous state of the extensions
   * @param extensionAction IAction action to apply
   * @param requestState IRequest request state read-only
   * @param actionSigner IIdentity identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension
   */
  public applyActionToExtensions(
    extensionsState: RequestLogicTypes.IExtensionStates,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): RequestLogicTypes.IExtensionStates {
    const id: ExtensionTypes.ID = extensionAction.id;

    if (id === ExtensionTypes.ID.CONTENT_DATA) {
      return contentData.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED) {
      return addressBasedBtc.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED) {
      return addressBasedTestnetBtc.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE) {
      return declarative.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED) {
      return addressBasedErc20.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT) {
      return proxyContractErc20.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
      return feeProxyContractErc20.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }
    if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA) {
      return ethereumInputData.applyActionToExtension(
        extensionsState,
        extensionAction,
        requestState,
        actionSigner,
        timestamp,
      );
    }

    throw Error(`extension not recognized, id: ${id}`);
  }
}
