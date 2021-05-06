import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import contentData from './extensions/content-data';
import AddressBasedBtc from './extensions/payment-network/bitcoin/mainnet-address-based';
import AddressBasedTestnetBtc from './extensions/payment-network/bitcoin/testnet-address-based';
import declarative from './extensions/payment-network/declarative';
import AddressBasedErc20 from './extensions/payment-network/erc20/address-based';
import FeeProxyContractErc20 from './extensions/payment-network/erc20/fee-proxy-contract';
import ProxyContractErc20 from './extensions/payment-network/erc20/proxy-contract';
import EthereumInputData from './extensions/payment-network/ethereum/input-data';
import AnyToErc20Proxy from './extensions/payment-network/any-to-erc20-proxy';

const anyToErc20Proxy = new AnyToErc20Proxy();
const feeProxyContractErc20 = new FeeProxyContractErc20();
const proxyContractErc20 = new ProxyContractErc20();
const addressBasedTestnetBtc = new AddressBasedTestnetBtc();
const addressBasedBtc = new AddressBasedBtc();
const addressBasedErc20 = new AddressBasedErc20();
const ethereumInputData = new EthereumInputData();

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
    const extension: ExtensionTypes.IExtension | undefined = {
      [ExtensionTypes.ID.CONTENT_DATA]: contentData,
      [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED]: addressBasedBtc,
      [ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED]: addressBasedTestnetBtc,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE]: declarative,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED]: addressBasedErc20,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: proxyContractErc20,
      [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: feeProxyContractErc20,
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
