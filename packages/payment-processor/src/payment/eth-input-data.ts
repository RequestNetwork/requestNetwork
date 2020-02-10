import { ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify } from 'ethers/utils';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { getProvider, getRequestPaymentValues, getSigner, validateRequest } from './utils';

/**
 * processes the transaction to pay an ETH request.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function payEthInputDataRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
): Promise<ContractTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);
  const signer = getSigner(signerOrProvider);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const tx = await signer.sendTransaction({
    data: `0x${paymentReference}`,
    to: paymentAddress,
    value: bigNumberify(request.expectedAmount),
  });
  return tx;
}

/**
 * Not implemented yet.
 */
export function getEthPaymentUrl(_request: ClientTypes.IRequestData): string {
  return '';
}
