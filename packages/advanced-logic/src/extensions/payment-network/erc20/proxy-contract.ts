import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBasedPaymentNetwork from '../reference-based';

const CURRENT_VERSION = '0.1.0';

import * as walletAddressValidator from 'wallet-address-validator';

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
export default class Erc20ProxyPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnReferenceBased.ICreationParameters = ExtensionTypes.PnReferenceBased.ICreationParameters
> extends ReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
    public currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['mainnet', 'rinkeby', 'private'],
    public supportedCurrencyType: string = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
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
