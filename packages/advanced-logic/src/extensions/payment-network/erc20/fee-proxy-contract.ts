import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { FeeReferenceBasedPaymentNetwork } from '../fee-reference-based';
import EvmBasedPaymentNetwork from '../evm-based';

const CURRENT_VERSION = '0.2.0';

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc20FeeProxyPaymentNetwork<
    TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
  >
  extends FeeReferenceBasedPaymentNetwork<TCreationParameters>
  implements EvmBasedPaymentNetwork
{
  public constructor(
    public readonly extensionId: ExtensionTypes.ID = ExtensionTypes.ID
      .PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
    public readonly currentVersion: string = CURRENT_VERSION,
    public readonly supportedNetworks: string[] = EvmBasedPaymentNetwork.EVM_NETWORKS,
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }
}
