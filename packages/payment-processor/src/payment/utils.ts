import { ethers } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

export const getProvider = (): Web3Provider => {
  const win = window as any;
  if (!win.ethereum) {
    throw new Error('ethereum not found');
  }
  const provider = new ethers.providers.Web3Provider(win.ethereum);
  return provider;
};

export const getRequestPaymentValues = (
  request: ClientTypes.IRequestData,
): { paymentAddress: string; paymentReference: string } => {
  const extension = request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT];
  const { paymentAddress, salt } = extension.values;
  const paymentReference = PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    paymentAddress,
  );
  return { paymentAddress, paymentReference };
};
