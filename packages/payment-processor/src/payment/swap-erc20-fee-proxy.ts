import { constants, ContractTransaction, Signer, BigNumber, BigNumberish, providers } from 'ethers';

import { erc20FeeProxyArtifact, erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ERC20SwapToPay__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getProxyAddress,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';
import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { EvmChains } from '@requestnetwork/currency';

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
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param swapSettings settings for the swap: swap path, max amount to swap, deadline
 * @param options to override amount, feeAmount and transaction parameters
 */
export async function swapErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  swapSettings: ISwapSettings,
  options?: ISwapTransactionOptions,
): Promise<ContractTransaction> {
  const preparedTx = prepareSwapToPayErc20FeeRequest(
    request,
    signerOrProvider,
    swapSettings,
    options,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare a transaction to swap tokens and pay an ERC20 Request through a proxy with fees.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param swapSettings settings for the swap: swap path, max amount to swap, deadline
 * @param options to override amount, feeAmount and transaction parameters
 */
export function prepareSwapToPayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  swapSettings: ISwapSettings,
  options?: ISwapTransactionOptions,
): IPreparedTransaction {
  const { network } = request.currencyInfo;
  EvmChains.assertChainSupported(network!);
  const encodedTx = encodeSwapToPayErc20FeeRequest(
    request,
    signerOrProvider,
    swapSettings,
    options,
  );
  const proxyAddress = erc20SwapToPayArtifact.getAddress(network);
  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...options?.overrides,
  };
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
  signerOrProvider: providers.Provider | Signer = getProvider(),
  swapSettings: ISwapSettings,
  options?: IRequestPaymentOptions,
): string {
  const { paymentReference, paymentAddress, feeAddress, feeAmount, network } =
    getRequestPaymentValues(request);
  EvmChains.assertChainSupported(network!);

  validateErc20FeeProxyRequest(request, options?.amount, options?.feeAmount);

  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  const amountToPay = getAmountToPay(request, options?.amount);
  const feeToPay = BigNumber.from(options?.feeAmount || feeAmount || 0);

  if (
    swapSettings.path[swapSettings.path.length - 1].toLowerCase() !== tokenAddress.toLowerCase()
  ) {
    throw new Error('Last item of the path should be the request currency');
  }
  // eslint-disable-next-line no-magic-numbers
  if (Date.now() > swapSettings.deadline * 1000) {
    throw new Error('A swap with a past deadline will fail, the transaction will not be pushed');
  }
  if (!request.currencyInfo.network) {
    throw new Error('Request currency network is missing');
  }

  const feeProxyAddress = getProxyAddress(
    request,
    Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector.getDeploymentInformation,
  );

  const swapToPayAddress = erc20FeeProxyArtifact.getAddress(network);
  const swapToPayContract = ERC20SwapToPay__factory.connect(swapToPayAddress, signer);

  return swapToPayContract.interface.encodeFunctionData('swapTransferWithReference', [
    feeProxyAddress,
    paymentAddress,
    amountToPay,
    swapSettings.maxInputAmount,
    swapSettings.path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    // eslint-disable-next-line no-magic-numbers
    Math.round(swapSettings.deadline / 1000),
  ]);
}
