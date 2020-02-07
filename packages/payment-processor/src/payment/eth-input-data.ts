import { ContractTransaction, Signer } from 'ethers';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

export const payEthInputDataRequest = async (
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<ContractTransaction> => {
  const { values } = request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA];
  if (!values || !values.salt || !values.paymentAddress) {
    throw new Error('request cannot be processed, or is not an ETH INPUT DATA request');
  }

  const paymentReference = PaymentReferenceCalculator.calculate(
    request.requestId,
    values.salt,
    values.paymentAddress,
  );
  const tx = await signer.sendTransaction({
    data: `0x${paymentReference}`,
    to: values.paymentAddress,
    value: request.expectedAmount,
  });
  return tx;
};

export const getEthPaymentUrl = (_request: ClientTypes.IRequestData): string => {
  return '';
};
