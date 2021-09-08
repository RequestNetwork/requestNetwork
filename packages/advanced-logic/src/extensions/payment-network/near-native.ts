import { ExtensionTypes } from '@requestnetwork/types';
import { UnsupportedNetworkError } from './address-based';

import NativeTokenPaymentNetwork from './native-token';

const CURRENT_VERSION = '0.1.0';
const supportedNetworks = ['aurora', 'aurora-testnet'];

/**
 * Implementation of the payment network to pay in ETH based on input data.
 */
export default class NearNativePaymentNetwork extends NativeTokenPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
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
  protected isValidAddress(address: string, networkName?: string): boolean {
    switch (networkName) {
      case 'aurora':
        return this.isValidMainnet(address);
      case 'aurora-testnet':
        return this.isValidTestnet(address);
      case undefined:
        return this.isValidMainnet(address) || this.isValidTestnet(address);
      default:
        throw new UnsupportedNetworkError(networkName, this.supportedNetworks);
    }
  }

  private isValidTestnet(address: string): boolean {
    return !!address.match(/\.testnet$/);
  }

  private isValidMainnet(address: string): boolean {
    return !!address.match(/\.near$/);
  }
}
