import { ethers } from 'ethers';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

export const getBtcPaymentUrl = (request: ClientTypes.IRequestData): string => {
  const pn = Object.values(request.extensions).find(
    x => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
  return `bitcoin:${pn?.values.paymentAddress}?amount=${ethers.utils.formatUnits(
    request.expectedAmount,
    8,
  )}`;
};
