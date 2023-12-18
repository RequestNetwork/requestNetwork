import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ICurrencyManager, NearChains, isSameChain } from '@requestnetwork/currency';
import { UnsupportedNetworkError } from '../address-based';
import { FeeReferenceBasedPaymentNetwork } from '../fee-reference-based';

const EVM_CURRENT_VERSION = '0.2.0';
const NEAR_CURRENT_VERSION = 'NEAR-0.1.0';

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc20FeeProxyPaymentNetwork<
  TCreationParameters extends
    ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
> extends FeeReferenceBasedPaymentNetwork<TCreationParameters> {
  /**
   * @param network is only relevant for non-EVM chains (Near and Near testnet)
   */
  public constructor(
    currencyManager: ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ERC20_FEE_PROXY_CONTRACT,
    currentVersion?: string | undefined,
    protected network?: string | undefined,
  ) {
    super(
      currencyManager,
      extensionId,
      currentVersion ?? Erc20FeeProxyPaymentNetwork.getDefaultCurrencyVersion(network),
      RequestLogicTypes.CURRENCY.ERC20,
    );
  }

  protected static getDefaultCurrencyVersion(network?: string): string {
    return NearChains.isChainSupported(network) ? NEAR_CURRENT_VERSION : EVM_CURRENT_VERSION;
  }

  // Override `validate` to account for network-specific instanciation (non-EVM only)
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      this.network &&
      request.currency.network &&
      !isSameChain(this.network, request.currency.network)
    ) {
      throw new UnsupportedNetworkError(request.currency.network, [this.network]);
    }
    super.validate(request, extensionAction);
  }

  // Override `isValidAddress` to account for network-specific instanciation (non-EVM only)
  protected isValidAddress(address: string): boolean {
    if (NearChains.isChainSupported(this.network)) {
      if (NearChains.isTestnet(this.network as CurrencyTypes.NearChainName)) {
        return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', 'near-testnet');
      } else {
        return this.isValidAddressForSymbolAndNetwork(address, 'NEAR', 'near');
      }
    } else {
      return super.isValidAddress(address);
    }
  }
}
