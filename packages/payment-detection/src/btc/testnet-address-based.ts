import { AdvancedLogicTypes, PaymentTypes, ExtensionTypes } from '@requestnetwork/types';

import { BtcAddressBasedDetector } from './address-based.js';

const TESTNET_BITCOIN_NETWORK_ID = 3;

/**
 * Handle payment networks with testnet BTC based address extension
 *
 * @class PaymentNetworkBTCAddressBased
 */
export class BtcTestnetAddressBasedDetector extends BtcAddressBasedDetector {
  /**
   * @param advancedLogic Instance of Advanced Logic layer, to get the extension
   */
  public constructor({
    advancedLogic,
    bitcoinDetectionProvider,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  }) {
    super(
      TESTNET_BITCOIN_NETWORK_ID,
      ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      advancedLogic.extensions.addressBasedTestnetBtc,
      bitcoinDetectionProvider,
    );
  }
}
