import { ExtensionTypes } from '@requestnetwork/types';
import NativeTokenPaymentNetwork from '../native-token';

const CURRENT_VERSION = '0.2.0';

/**
 * Implementation of the payment network to pay in Near based on input data.
 */
export default class NearNativePaymentNetwork extends NativeTokenPaymentNetwork {
  public constructor(
    supportedNetworks: string[] = ['aurora', 'near'],
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN, currentVersion, supportedNetworks);
  }

  /**
   * Check if a near address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR', 'aurora');
  }
}
