import { ExtensionTypes, CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedPaymentNetwork from '../reference-based';

const CURRENT_VERSION = '0.0.1';

export default class HinkalWalletPaymentNetwork<
  TCreationParameters extends
    ExtensionTypes.PnAnyHinkalWallet.ICreationParameters = ExtensionTypes.PnAnyHinkalWallet.ICreationParameters,
> extends ReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    currencyManager: CurrencyTypes.ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ERC20_HINKAL_WALLET,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(currencyManager, extensionId, currentVersion, RequestLogicTypes.CURRENCY.ERC20);
  }
}
