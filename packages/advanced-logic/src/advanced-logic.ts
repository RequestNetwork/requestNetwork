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
import Erc20ProxyPaymentNetwork from './extensions/payment-network/erc20/proxy-contract';
import ethereumInputData from './extensions/payment-network/ethereum/input-data';
import anyToErc20Proxy from './extensions/payment-network/any-to-erc20-proxy';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default class AdvancedLogic implements AdvancedLogicTypes.IAdvancedLogic {
  /** Give access to the functions specific of the extensions supported */
  public extensions = {
    addressBasedBtc,
    addressBasedErc20,
    addressBasedTestnetBtc,
    contentData,
    anyToErc20Proxy,
    declarative,
    ethereumInputData,
    feeProxyContractErc20,
    // proxyContractErc20, TODO TODO TODO
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
    const extension: ExtensionTypes.IExtension | undefined = {
      [ExtensionTypes.ID.CONTENT_DATA]: contentData,
      [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]: addressBasedBtc,
      [ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED]: addressBasedTestnetBtc,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE]: declarative,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED]: addressBasedErc20,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: new Erc20ProxyPaymentNetwork(),
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: new feeProxyContractErc20(),
      [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: ethereumInputData,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY]: anyToErc20Proxy,
    }[id];

    if (!extension) {
      throw Error(`extension not recognized, id: ${id}`);
    }

    return extension.applyActionToExtension(
      extensionsState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }
}
