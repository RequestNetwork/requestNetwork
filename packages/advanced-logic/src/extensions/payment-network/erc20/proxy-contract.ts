import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedPaymentNetwork from '../reference-based';
import EvmBasedPaymentNetwork from '../evm-based';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 */
export default class Erc20ProxyPaymentNetwork<
    TCreationParameters extends ExtensionTypes.PnReferenceBased.ICreationParameters = ExtensionTypes.PnReferenceBased.ICreationParameters,
  >
  extends ReferenceBasedPaymentNetwork<TCreationParameters>
  implements EvmBasedPaymentNetwork
{
  public constructor(
    public readonly extensionId: ExtensionTypes.ID = ExtensionTypes.ID
      .PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
    public readonly currentVersion: string = CURRENT_VERSION,
    public readonly supportedNetworks: string[] = EvmBasedPaymentNetwork.EVM_NETWORKS,
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }
}
