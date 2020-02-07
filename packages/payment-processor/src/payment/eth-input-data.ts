import { ContractTransaction, Signer } from 'ethers';
import { bigNumberify } from 'ethers/utils';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { getRequestPaymentValues, validateRequest } from './utils';

export const payEthInputDataRequest = async (
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<ContractTransaction> => {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const tx = await signer.sendTransaction({
    data: `0x${paymentReference}`,
    to: paymentAddress,
    value: bigNumberify(request.expectedAmount),
  });
  return tx;
};

export const getEthPaymentUrl = (_request: ClientTypes.IRequestData): string => {
  return '';
};
