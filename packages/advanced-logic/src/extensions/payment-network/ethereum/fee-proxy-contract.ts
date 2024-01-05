import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { FeeReferenceBasedPaymentNetwork } from '../fee-reference-based';
import { ICurrencyManager } from '@requestnetwork/currency';

const CURRENT_VERSION = '0.2.0';

/**
 * Implementation of the payment network to pay in Ethereum, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class EthereumFeeProxyPaymentNetwork<
  TCreationParameters extends
    ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
> extends FeeReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    currencyManager: ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ETH_FEE_PROXY_CONTRACT,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(currencyManager, extensionId, currentVersion, RequestLogicTypes.CURRENCY.ETH);
  }
}
