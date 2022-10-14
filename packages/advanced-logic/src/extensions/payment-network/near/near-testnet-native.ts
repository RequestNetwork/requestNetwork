import NearNativePaymentNetwork from './near-native';

const NETWORK = 'aurora-testnet';

/**
 * Implementation of the payment network to pay in Near on testnet based on input data.
 */
export default class NearTestnetNativeNativePaymentNetwork extends NearNativePaymentNetwork {
  public constructor() {
    // testnet PN version is the same as mainnet, can be overridden here if needed
    super([NETWORK]);
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
