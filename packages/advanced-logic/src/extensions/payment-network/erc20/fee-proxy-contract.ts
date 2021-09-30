import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import FeeReferenceBasedPaymentNetwork from '../fee-reference-based';
import { CurrencyManager } from '@requestnetwork/currency';

const CURRENT_VERSION = '0.2.0';

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc20FeeProxyPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters
> extends FeeReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = [
      'mainnet',
      'rinkeby',
      'private',
      'matic',
      'mumbai',
      'celo',
      'alfajores',
      'fuse',
      'bsctest',
    ],
    public supportedCurrencyType: string = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }

  /**
   * Check if an ethereum address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    const currencyManager: CurrencyManager = CurrencyManager.getDefault();
    const currency = currencyManager.from('ETH', 'mainnet')!;
    return CurrencyManager.validateAddress(address, currency);
  }
}
