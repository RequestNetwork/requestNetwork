import { ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { BigNumberish } from 'ethers/utils';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
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
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthInputDataRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);
  const signer = getSigner(signerOrProvider);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);

  const tx = await signer.sendTransaction({
    data: `0x${paymentReference}`,
    to: paymentAddress,
    value: amountToPay,
    ...overrides,
  });
  return tx;
}

/**
 * processes the transaction to pay an ETH request.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function _getEthPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): string {
  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);

  // tslint:disable-next-line: no-console
  return `ethereum:${paymentAddress}?value=${amountToPay}&data=${paymentReference}`;
}
