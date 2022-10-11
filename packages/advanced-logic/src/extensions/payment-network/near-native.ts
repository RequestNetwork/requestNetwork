import { ExtensionTypes } from '@requestnetwork/types';
import { UnsupportedNetworkError } from './address-based';
import NativeTokenPaymentNetwork from './native-token';
import * as Semver from 'semver';

const CURRENT_VERSION = '0.3.0';
const supportedNetworksLegacy = ['aurora', 'aurora-testnet'];
const supportedNetworks = ['near', 'near-testnet'];

/**
 * Implementation of the payment network to pay in Near based on input data.
 */
export default class NearNativePaymentNetwork extends NativeTokenPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
    currentVersion: string = CURRENT_VERSION,
  ) {
    const supportedNetworksForVersion = Semver.lt(currentVersion, CURRENT_VERSION)
      ? supportedNetworksLegacy
      : supportedNetworks;
    super(extensionId, currentVersion, supportedNetworksForVersion);
  }

  /**
   * Check if a near address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string, networkName?: string): boolean {
    switch (networkName) {
      case 'aurora':
      case 'near':
        return this.isValidMainnetAddress(address);
      case 'aurora-testnet':
      case 'near-testnet':
        return this.isValidTestnetAddress(address);
      case undefined:
        return this.isValidMainnetAddress(address) || this.isValidTestnetAddress(address);
      default:
        throw new UnsupportedNetworkError(networkName, this.supportedNetworks);
    }
  }

  private isValidMainnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR', 'near');
  }

  private isValidTestnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', 'near-testnet');
  }
}
