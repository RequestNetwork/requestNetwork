import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import FeeReferenceBasedPaymentNetwork from '../fee-reference-based';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in Ethereum, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class EthereumFeeProxyPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters
> extends FeeReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['mainnet', 'rinkeby', 'private'],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }
}
