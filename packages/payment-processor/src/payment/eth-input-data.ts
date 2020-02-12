import { ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { BigNumberish } from 'ethers/utils';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';

/**
 * processes the transaction to pay an ETH request.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function payEthInputDataRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): Promise<ContractTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);
  const signer = getSigner(signerOrProvider);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);

  const tx = await signer.sendTransaction({
    data: `0x${paymentReference}`,
    to: paymentAddress,
    value: amountToPay,
  });
  return tx;
}

/**
 * Not implemented yet.
 */
export function getEthPaymentUrl(_request: ClientTypes.IRequestData): string {
  return '';
}
