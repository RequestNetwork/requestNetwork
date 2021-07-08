import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBasedPaymentNetwork from '../reference-based';

import * as walletAddressValidator from 'wallet-address-validator';

const CURRENT_VERSION = '0.2.0';
const supportedNetworks = ['mainnet', 'rinkeby', 'xdai', 'sokol', 'fuse', 'celo', 'matic'];

/**
 * Implementation of the payment network to pay in ETH based on input data.
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

  protected validate(
    request: RequestLogicTypes.IRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      request.currency.type !== RequestLogicTypes.CURRENCY.ETH ||
      (request.currency.network && !supportedNetworks.includes(request.currency.network))
    ) {
      throw Error(
        `This extension can be used only on ETH requests and on supported networks ${supportedNetworks.join(
          ', ',
        )}`,
      );
    }
  }
}
