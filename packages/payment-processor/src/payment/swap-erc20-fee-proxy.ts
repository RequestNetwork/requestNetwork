import { constants, ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { erc20FeeProxyArtifact, erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';

import { Erc20SwapToPayContract } from '../contracts/Erc20SwapToPayContract';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
} from './utils';

/**
 * Details required for a token swap:
 *
 *  - maxInputAmount: maximum number of ERC20 allowed for the swap before payment, considering both amount and fees
 *  - path: array of token addresses to be used for the "swap path".
 *    ['0xPaymentCurrency', '0xIntermediate1', ..., '0xRequestCurrency']
 *  - deadline: time in milliseconds since UNIX epoch, after which the swap should not be executed.
 */
export interface ISwapSettings {
  deadline: number;
  maxInputAmount: BigNumberish;
  path: string[];
}

/**
 * Details required for a request payment transaction
 * @member overrides custom swap transaction parameters
 */
export interface ISwapTransactionOptions extends IRequestPaymentOptions {
  overrides?: ITransactionOverrides;
}

/**
 * Details required for a proxy payment:
 * @member {BigNumberish} amount custom request amount to pay
 * @member {BigNumberish} feeAmount custom fee amount to pay for the proxy
 */
export interface IRequestPaymentOptions {
  amount?: BigNumberish;
  feeAmount?: BigNumberish;
}

/**
 * Processes a transaction to swap tokens and pay an ERC20 Request through a proxy with fees.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param swapSettings settings for the swap: swap path, max amount to swap, deadline
 * @param options to override amount, feeAmount and transaction parameters
 */
export async function swapErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  swapSettings: ISwapSettings,
  options?: ISwapTransactionOptions,
): Promise<ContractTransaction> {
  const encodedTx = encodeSwapToPayErc20FeeRequest(
    request,
    signerOrProvider,
    swapSettings,
    options,
  );
  const proxyAddress = erc20SwapToPayArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...options?.overrides,
  });
  return tx;
}

/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum
 * @param swapSettings settings for the swap
 * @param options to override amount, feeAmount and transaction parameters
 */
export function encodeSwapToPayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  swapSettings: ISwapSettings,
  options?: IRequestPaymentOptions,
): string {
  validateErc20FeeProxyRequest(request, options?.amount, options?.feeAmount);

  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
  request,
  );
  const amountToPay = getAmountToPay(request, options?.amount);
  const feeToPay = bigNumberify(options?.feeAmount || feeAmount || 0);

  if (swapSettings.path[swapSettings.path.length - 1].toLowerCase() !== tokenAddress.toLowerCase()) {
  throw new Error('Last item of the path should be the request currency');
  }
  // tslint:disable-next-line:no-magic-numbers
  if (Date.now() > (swapSettings.deadline * 1000)) {
  throw new Error('A swap with a past deadline will fail, the transaction will not be pushed');
  }

  const swapToPayAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const swapToPayContract = Erc20SwapToPayContract.connect(swapToPayAddress, signer);

  return swapToPayContract.interface.functions.swapTransferWithReference.encode([
    paymentAddress,
    amountToPay,
    swapSettings.maxInputAmount,
    swapSettings.path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    // tslint:disable-next-line:no-magic-numbers
    Math.round(swapSettings.deadline / 1000),
  ]);
}
