import { ethers } from 'ethers';

import { ClientTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from './utils';

export const getBtcPaymentUrl = (request: ClientTypes.IRequestData): string => {
  const pn = getPaymentNetworkExtension(request);
  return `bitcoin:${pn?.values.paymentAddress}?amount=${ethers.utils.formatUnits(
    request.expectedAmount,
    8,
  )}`;
};
