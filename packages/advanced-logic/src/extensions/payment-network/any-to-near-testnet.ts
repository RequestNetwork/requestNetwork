import { ICurrencyManager } from '@requestnetwork/currency';
import AnyToNearPaymentNetwork from './any-to-near';

const NETWORK = 'aurora-testnet';

export default class AnyToNearTestnetPaymentNetwork extends AnyToNearPaymentNetwork {
  public constructor(currencyManager: ICurrencyManager) {
    super(currencyManager, [NETWORK]);
  }

  /**
   * Check if a near testnet address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', NETWORK);
  }
}
