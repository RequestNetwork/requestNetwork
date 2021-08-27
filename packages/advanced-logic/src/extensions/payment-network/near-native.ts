import { ExtensionTypes } from '@requestnetwork/types';

import NativeTokenPaymentNetwork from './native-tokens';

const CURRENT_VERSION = '0.1.0';
const supportedNetworks = ['aurora'];

/**
 * Implementation of the payment network to pay in ETH based on input data.
 */
export default class NearNativePaymentNetwork extends NativeTokenPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_NEAR_NATIVE,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion, supportedNetworks);
  }

  /**
   * Check if an ethereum address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    // TODO
    return !!address.match(/\.near/);
  }
}
