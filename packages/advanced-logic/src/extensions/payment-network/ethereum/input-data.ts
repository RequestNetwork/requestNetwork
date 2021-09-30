import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBasedPaymentNetwork from '../reference-based';

import * as walletAddressValidator from 'multicoin-address-validator';

const CURRENT_VERSION = '0.2.0';
const supportedNetworks = [
  'mainnet',
  'rinkeby',
  'xdai',
  'sokol',
  'fuse',
  'matic',
  'celo',
  'fantom',
  'bsctest',
];

/**
 * Implementation of the payment network to pay in native token
 * FIXME: rename into EVMNativePaymentNetwork
 */
export default class EthInputPaymentNetwork extends ReferenceBasedPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }

  /**
   * Check if an ethereum address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return walletAddressValidator.validate(address, 'ethereum');
  }
}
