import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { FeeReferenceBasedPaymentNetwork } from '../fee-reference-based';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC777, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc777StreamPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters
> extends FeeReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['matic', 'xdai', 'mumbai', 'rinkeby', 'arbitrum-rinkeby'],
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC777,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }
}
