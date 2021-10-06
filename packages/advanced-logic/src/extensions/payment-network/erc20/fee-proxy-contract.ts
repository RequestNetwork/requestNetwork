import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import FeeReferenceBasedPaymentNetwork from '../fee-reference-based';

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
      'bsc',
    ],
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }
}
