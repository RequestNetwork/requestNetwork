import { ExtensionTypes } from '@requestnetwork/types';
import { UnsupportedNetworkError } from './address-based';
import NativeTokenPaymentNetwork from './native-token';

const CURRENT_VERSION = '0.2.0';
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
        return this.isValidMainnetAddress(address);
      case 'aurora-testnet':
        return this.isValidTestnetAddress(address);
      case undefined:
        return this.isValidMainnetAddress(address) || this.isValidTestnetAddress(address);
      default:
        throw new UnsupportedNetworkError(networkName, this.supportedNetworks);
    }
  }

  private isValidMainnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR', 'aurora');
  }

  private isValidTestnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', 'aurora-testnet');
  }
}
