import { constants, ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { erc20FeeProxyArtifact, erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { Erc20FeeProxyContract } from '../contracts/Erc20FeeProxyContract';
import { Erc20SwapToPayContract } from '../contracts/Erc20SwapToPayContract';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayErc20FeeRequest(request, signerOrProvider, amount, feeAmount);

  const proxyAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

interface ISwapSettings {
  deadline: number;
  maxInputAmount: BigNumberish;
  path: string[];
}

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param maxInputAmount maximum number of ERC20 allowed for the swap before payment, considering both amount and fees
 * @param path array of token addresses to be swapped: ['0xPaymentCcy', '0xOptIntermediate1', ..., '0xRequestCcy']
 * The first element should be the payment currency.             
 * The last element should be the request currency.
 * Each intermediate currency will be used for intermediate swaps between these two tokens.
 * @param deadline is the time in milliseconds since UNIX epoch, after which the swap should not be executed.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function swapErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  maxInputAmount: BigNumberish,
  path: string[],
  deadline: number,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const proxyAddress = erc20SwapToPayArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const encodedTx = encodePayErc20FeeRequest(request, signerOrProvider, amount, feeAmount, {
    deadline,
    maxInputAmount,
    path,
  });

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 * @param swapSettings settings for the swap:
 *  maxInputAmount: maximum number of ERC20 allowed for the swap before payment, considering both amount and fees
 *  path: array of token addresses to be used for the "swap path". 
 *    ['0xPaymentCcy', '0xIntermediate1', ..., '0xRequestCcy']
 *    The first element should be the payment currency.             
 *    The last element should be the request currency.
 *    Each intermediate currency will be used for intermediate swaps.
 *  deadline: time in milliseconds since UNIX epoch, after which the swap should not be executed.
 */
export function encodePayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
  swapSettings?: ISwapSettings,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const tokenAddress = request.currencyInfo.value;

  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );

  if (!!feeAmount !== !!feeAddress) {
    throw new Error('Both fee address and fee amount have to be declared, or both left empty');
  }

  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = bigNumberify(feeAmountOverride || feeAmount || 0);

  if (amountToPay.isZero() && feeToPay.isZero()) {
    throw new Error('Request payment amount and fee are 0');
  }

  if (swapSettings === undefined) {
    const proxyAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
    const proxyContract = Erc20FeeProxyContract.connect(proxyAddress, signer);

    return proxyContract.interface.functions.transferFromWithReferenceAndFee.encode([
      tokenAddress,
      paymentAddress,
      amountToPay,
      `0x${paymentReference}`,
      feeToPay,
      feeAddress || constants.AddressZero,
    ]);
  }

  // Swap to pay
  const swapToPayAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);

  if (swapSettings.path[swapSettings.path.length - 1] !== tokenAddress) {
    throw new Error('Last item of the path should be the request currency');
  }
  if (Date.now() > swapSettings.deadline) {
    throw new Error('A swap with a past deadline will fail, the transaction will not be pushed');
  }
  const swapToPayContract = Erc20SwapToPayContract.connect(swapToPayAddress, signer);

  return swapToPayContract.interface.functions.swapTransferWithReference.encode([
    paymentAddress,
    amountToPay,
    swapSettings.maxInputAmount,
    swapSettings.path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    Math.round(swapSettings.deadline / 1000),
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function _getErc20FeeProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const contractAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = feeAmountOverride || bigNumberify(feeAmount || 0);
  const parameters = `transferFromWithReferenceAndFee?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}&uint256=${feeToPay}&address=${feeAddress}`;
  return `ethereum:${contractAddress}/${parameters}`;
}
