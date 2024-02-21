import { ChainTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
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
    protected network?: ChainTypes.IChain | undefined,
  ) {
    super(
      currencyManager,
      extensionId,
      currentVersion ??
        Erc20FeeProxyPaymentNetwork.getDefaultCurrencyVersion(
          currencyManager.chainManager,
          network,
        ),
      RequestLogicTypes.CURRENCY.ERC20,
    );
  }

  protected static getDefaultCurrencyVersion(
    chainManager: ChainTypes.IChainManager,
    network?: ChainTypes.IChain | undefined,
  ): string {
    return chainManager.ecosystems[ChainTypes.ECOSYSTEM.NEAR].isChainSupported(network)
      ? NEAR_CURRENT_VERSION
      : EVM_CURRENT_VERSION;
  }

  // Override `validate` to account for network-specific instantiation (non-EVM only)
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      this.network &&
      request.currency.network &&
      !this.currencyManager.chainManager.isSameChain(
        this.network,
        request.currency.network,
        ChainTypes.VM_ECOSYSTEMS,
      )
    ) {
      throw new UnsupportedNetworkError(this.constructor.name, request.currency.network, [
        this.network.name,
      ]);
    }
    super.validate(request, extensionAction);
  }

  // Override `isValidAddress` to account for network-specific instantiation (non-EVM only)
  protected isValidAddress(address: string): boolean {
    if (
      this.currencyManager.chainManager.ecosystems[ChainTypes.ECOSYSTEM.NEAR].isChainSupported(
        this.network,
      )
    ) {
      if (this.network?.testnet) {
        return this.isValidAddressForSymbolAndNetwork(
          address,
          'NEAR-testnet',
          this.currencyManager.chainManager.fromName('near-testnet', [ChainTypes.ECOSYSTEM.NEAR]),
        );
      } else {
        return this.isValidAddressForSymbolAndNetwork(
          address,
          'NEAR',
          this.currencyManager.chainManager.fromName('near', [ChainTypes.ECOSYSTEM.NEAR]),
        );
      }
    } else {
      return super.isValidAddress(address);
    }
  }
}
