import { AdvancedLogicTypes, PaymentTypes } from '@requestnetwork/types';

import { BtcAddressBasedDetector } from './address-based';

const MAINNET_BITCOIN_NETWORK_ID = 0;

/**
 * Handle payment networks with mainnet BTC based address extension
 *
 * @class PaymentNetworkBTCAddressBased
 */
export class BtcMainnetAddressBasedDetector extends BtcAddressBasedDetector {
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
      MAINNET_BITCOIN_NETWORK_ID,
      PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
      advancedLogic.extensions.addressBasedBtc,
      bitcoinDetectionProvider,
    );
  }
}
