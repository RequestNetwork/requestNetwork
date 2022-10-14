import { ICurrencyManager } from '@requestnetwork/currency';
import AnyToNearPaymentNetwork from './any-to-near';

export default class AnyToNearTestnetPaymentNetwork extends AnyToNearPaymentNetwork {
  public constructor(currencyManager: ICurrencyManager) {
    // testnet PN version is the same as mainnet, can be overridden here if needed
    super(currencyManager, ['aurora-testnet', 'near-testnet']);
  }

  /**
   * Check if a near testnet address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', 'aurora-testnet');
  }
}
