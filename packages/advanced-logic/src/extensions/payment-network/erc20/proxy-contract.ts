import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedPaymentNetwork from '../reference-based';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 */
export default class Erc20ProxyPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnReferenceBased.ICreationParameters = ExtensionTypes.PnReferenceBased.ICreationParameters
> extends ReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
    public currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['mainnet', 'rinkeby', 'private'],
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }
}
