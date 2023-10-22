import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedPaymentNetwork from '../reference-based.js';

const CURRENT_VERSION = '0.3.0';

/**
 * Implementation of the payment network to pay in native token
 * FIXME: rename into EVMNativePaymentNetwork
 */
export default class EthInputPaymentNetwork extends ReferenceBasedPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ETH_INPUT_DATA,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion, RequestLogicTypes.CURRENCY.ETH);
  }
}
