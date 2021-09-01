import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Erc20FeeProxyPaymentNetwork from './fee-proxy-contract';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc20TimeLockEscrowPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters
> extends Erc20FeeProxyPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_TIME_LOCKED_ESCROW,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['mainnet', 'rinkeby', 'private'],
    public supportedCurrencyType: string = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion);
  }
}
