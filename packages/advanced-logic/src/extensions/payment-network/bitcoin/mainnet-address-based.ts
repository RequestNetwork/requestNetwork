import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AddressBasedPaymentNetwork from '../address-based';

const CURRENT_VERSION = '0.1.0';
const BITCOIN_NETWORK = 'mainnet';

/**
 * Implementation of the payment network to pay in BTC based on the addresses
 * With this extension one request can have two dedicated bitcoin addresses (one for payment and one for refund)
 * Every bitcoin transaction that reaches these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
export default class BitcoinAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    public currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = [BITCOIN_NETWORK],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.BTC);
  }
}
