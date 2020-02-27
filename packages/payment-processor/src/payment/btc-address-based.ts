import { ethers } from 'ethers';
import { BigNumberish } from 'ethers/utils';

import { ClientTypes } from '@requestnetwork/types';

import { getAmountToPay, getPaymentNetworkExtension } from './utils';

/**
 * Returns the BIP21 payment URL based on the Request's value
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function getBtcPaymentUrl(request: ClientTypes.IRequestData, amount?: BigNumberish): string {
  const pn = getPaymentNetworkExtension(request);
  const amountToPay = getAmountToPay(request, amount);
  return `bitcoin:${pn?.values.paymentAddress}?amount=${ethers.utils.formatUnits(amountToPay, 8)}`;
}
