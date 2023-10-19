import { ContractTransaction, Signer, BigNumberish, providers } from 'ethers';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides.js';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction.js';

/**
 * processes the transaction to pay an ETH request.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthInputDataRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const preparedTx = prepareEthInputDataRequest(request, amount, overrides);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * processes the transaction to pay an ETH request.
 * @param request the request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareEthInputDataRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);

  return {
    data: `0x${paymentReference}`,
    to: paymentAddress,
    value: amountToPay,
    ...overrides,
  };
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

  // eslint-disable-next-line no-console
  return `ethereum:${paymentAddress}?value=${amountToPay}&data=${paymentReference}`;
}
