import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager, ICurrencyManager } from '@requestnetwork/currency';

import ContentData from './extensions/content-data';
import AddressBasedBtc from './extensions/payment-network/bitcoin/mainnet-address-based';
import AddressBasedTestnetBtc from './extensions/payment-network/bitcoin/testnet-address-based';
import Declarative from './extensions/payment-network/declarative';
import AddressBasedErc20 from './extensions/payment-network/erc20/address-based';
import FeeProxyContractErc20 from './extensions/payment-network/erc20/fee-proxy-contract';
import ProxyContractErc20 from './extensions/payment-network/erc20/proxy-contract';
import Erc777Stream from './extensions/payment-network/erc777/stream';
import FeeProxyContractEth from './extensions/payment-network/ethereum/fee-proxy-contract';
import EthereumInputData from './extensions/payment-network/ethereum/input-data';
import NearNative from './extensions/payment-network/near/near-native';
import NearTestnetNative from './extensions/payment-network/near/near-testnet-native';
import AnyToErc20Proxy from './extensions/payment-network/any-to-erc20-proxy';
import AnyToEthProxy from './extensions/payment-network/any-to-eth-proxy';
import AnyToNear from './extensions/payment-network/near/any-to-near';
import AnyToNearTestnet from './extensions/payment-network/near/any-to-near-testnet';
import NativeToken from './extensions/payment-network/native-token';
import AnyToNative from './extensions/payment-network/any-to-native';

/**
 * Module to manage Advanced logic extensions
 * Package to route the format and parsing of extensions following their id
 */
export default class AdvancedLogic implements AdvancedLogicTypes.IAdvancedLogic {
  /** Give access to the functions specific of the extensions supported */
  public extensions: {
    addressBasedBtc: AddressBasedBtc;
    addressBasedErc20: AddressBasedErc20;
    addressBasedTestnetBtc: AddressBasedTestnetBtc;
    contentData: ContentData;
    anyToErc20Proxy: AnyToErc20Proxy;
    declarative: Declarative;
    ethereumInputData: EthereumInputData;
    nativeToken: NativeToken[];
    feeProxyContractErc20: FeeProxyContractErc20;
    proxyContractErc20: ProxyContractErc20;
    erc777Stream: Erc777Stream;
    feeProxyContractEth: FeeProxyContractEth;
    anyToEthProxy: AnyToEthProxy;
    anyToNativeToken: AnyToNative[];
  };

  constructor(currencyManager?: ICurrencyManager) {
    if (!currencyManager) {
      currencyManager = CurrencyManager.getDefault();
    }
    this.extensions = {
      addressBasedBtc: new AddressBasedBtc(),
      addressBasedErc20: new AddressBasedErc20(),
      addressBasedTestnetBtc: new AddressBasedTestnetBtc(),
      contentData: new ContentData(),
      anyToErc20Proxy: new AnyToErc20Proxy(currencyManager),
      declarative: new Declarative(),
      ethereumInputData: new EthereumInputData(),
      feeProxyContractErc20: new FeeProxyContractErc20(),
      proxyContractErc20: new ProxyContractErc20(),
      erc777Stream: new Erc777Stream(),
      feeProxyContractEth: new FeeProxyContractEth(),
      anyToEthProxy: new AnyToEthProxy(currencyManager),
      nativeToken: [new NearNative(), new NearTestnetNative()],
      anyToNativeToken: [new AnyToNear(currencyManager), new AnyToNearTestnet(currencyManager)],
    };
  }

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
    const extension = this.getExtensionForActionAndState(extensionAction, requestState);

    return extension.applyActionToExtension(
      extensionsState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }

  protected getExtensionForActionAndState(
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
  ): ExtensionTypes.IExtension<any> {
    const id: ExtensionTypes.ID = extensionAction.id;
    const extension: ExtensionTypes.IExtension | undefined = {
      [ExtensionTypes.ID.CONTENT_DATA]: this.extensions.contentData,
      [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: this.extensions.addressBasedBtc,
      [ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED]:
        this.extensions.addressBasedTestnetBtc,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: this.extensions.declarative,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED]: this.extensions.addressBasedErc20,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: this.extensions.proxyContractErc20,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]:
        this.extensions.feeProxyContractErc20,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM]: this.extensions.erc777Stream,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: this.extensions.ethereumInputData,
      [ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN]:
        this.getNativeTokenExtensionForActionAndState(extensionAction, requestState),
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: this.extensions.anyToErc20Proxy,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]:
        this.extensions.feeProxyContractEth,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: this.extensions.anyToEthProxy,
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]:
        this.getAnyToNativeTokenExtensionForActionAndState(extensionAction, requestState),
    }[id];

    if (!extension) {
      if (
        id === ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN ||
        id === ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN
      ) {
        const network =
          this.getNetwork(extensionAction, requestState) || requestState.currency.network;
        throw Error(`extension with id: ${id} not found for network: ${network}`);
      }

      throw Error(`extension not recognized, id: ${id}`);
    }
    return extension;
  }

  public getNativeTokenExtensionForNetwork(
    network: string,
  ): ExtensionTypes.IExtension<ExtensionTypes.PnReferenceBased.ICreationParameters> | undefined {
    return this.extensions.nativeToken.find((nativeTokenExtension) =>
      nativeTokenExtension.supportedNetworks.includes(network),
    );
  }

  protected getNativeTokenExtensionForActionAndState(
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
  ): ExtensionTypes.IExtension<ExtensionTypes.PnReferenceBased.ICreationParameters> | undefined {
    if (
      requestState.currency.network &&
      extensionAction.parameters.paymentNetworkName &&
      requestState.currency.network !== extensionAction.parameters.paymentNetworkName
    ) {
      throw new Error(
        `Cannot apply action for network ${extensionAction.parameters.paymentNetworkName} on state with payment network: ${requestState.currency.network}`,
      );
    }
    const network = requestState.currency.network ?? extensionAction.parameters.paymentNetworkName;
    return network ? this.getNativeTokenExtensionForNetwork(network) : undefined;
  }

  public getAnyToNativeTokenExtensionForNetwork(
    network: string,
  ): ExtensionTypes.IExtension<ExtensionTypes.PnAnyToEth.ICreationParameters> | undefined {
    return this.extensions.anyToNativeToken.find((anyToNativeTokenExtension) =>
      anyToNativeTokenExtension.supportedNetworks.includes(network),
    );
  }

  protected getAnyToNativeTokenExtensionForActionAndState(
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
  ): ExtensionTypes.IExtension<ExtensionTypes.PnAnyToEth.ICreationParameters> | undefined {
    const network = this.getNetwork(extensionAction, requestState);
    return network ? this.getAnyToNativeTokenExtensionForNetwork(network) : undefined;
  }

  protected getNetwork(
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
  ): string | undefined {
    const network =
      extensionAction.action === 'create'
        ? extensionAction.parameters.network
        : requestState.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]?.values
            ?.network;
    return network;
  }
}
