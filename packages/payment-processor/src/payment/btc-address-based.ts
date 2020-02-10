import { ethers } from 'ethers';

import { ClientTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from './utils';

/**
 * Returns the BIP21 payment URL based on the Request's value
 * @param request
 */
export function getBtcPaymentUrl(request: ClientTypes.IRequestData): string {
  const pn = getPaymentNetworkExtension(request);
  return `bitcoin:${pn?.values.paymentAddress}?amount=${ethers.utils.formatUnits(
    request.expectedAmount,
    8,
  )}`;
}
