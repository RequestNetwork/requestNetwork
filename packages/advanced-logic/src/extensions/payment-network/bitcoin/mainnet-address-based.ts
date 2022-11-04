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
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .BITCOIN_ADDRESS_BASED,
  ) {
    super(extensionId, CURRENT_VERSION, RequestLogicTypes.CURRENCY.BTC);
  }

  protected isValidAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'BTC', BITCOIN_NETWORK);
  }
}
