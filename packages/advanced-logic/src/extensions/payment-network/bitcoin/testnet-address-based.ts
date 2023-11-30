import BitcoinAddressBasedPaymentNetwork from './mainnet-address-based';
import { ExtensionTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';

const BITCOIN_NETWORK = 'testnet';

/**
 * Implementation of the payment network to pay in BTC based on the addresses ON THE BITCOIN TESTNET
 * This payment network MUST BE USED ONLY for TEST PURPOSE. it MUST NEVER BE USED for real request.
 * With this extension one request can have two dedicated bitcoin addresses (one for payment and one for refund)
 * Every bitcoin transaction that reaches these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
export default class BitcoinTestnetAddressBasedPaymentNetwork extends BitcoinAddressBasedPaymentNetwork {
  public constructor(currencyManager: ICurrencyManager) {
    super(currencyManager, ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED);
  }

  protected isValidAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'BTC-testnet', BITCOIN_NETWORK);
  }
}
