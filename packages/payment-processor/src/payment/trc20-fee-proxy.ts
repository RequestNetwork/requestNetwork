import { BigNumber, BigNumberish } from 'ethers';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { TronChains } from '@requestnetwork/currency';

import { getAmountToPay, getRequestPaymentValues, validateRequest } from './utils';
import {
  TronWeb,
  ITronTransactionCallback,
  processTronFeeProxyPayment,
  approveTrc20,
  getTronAllowance,
  isTronAccountSolvent,
  isValidTronAddress,
  getERC20FeeProxyAddress,
} from './utils-tron';
import { validatePaymentReference } from '../utils/validation';

/**
 * Checks if the TronWeb instance has sufficient allowance for the payment
 */
export async function hasSufficientTronAllowance(
  request: ClientTypes.IRequestData,
  tronWeb: TronWeb,
  amount?: BigNumberish,
): Promise<boolean> {
  const network = request.currencyInfo.network;
  if (!network || !TronChains.isChainSupported(network)) {
    throw new Error('Request currency network is not a supported Tron network');
  }
  TronChains.assertChainSupported(network);

  const tokenAddress = request.currencyInfo.value;
  const { feeAmount } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const totalAmount = BigNumber.from(amountToPay).add(feeAmount || 0);

  const allowance = await getTronAllowance(tronWeb, tokenAddress, network);
  return allowance.gte(totalAmount);
}

/**
 * Checks if the payer has sufficient TRC20 token balance
 */
export async function hasSufficientTronBalance(
  request: ClientTypes.IRequestData,
  tronWeb: TronWeb,
  amount?: BigNumberish,
): Promise<boolean> {
  const tokenAddress = request.currencyInfo.value;
  const { feeAmount } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const totalAmount = BigNumber.from(amountToPay).add(feeAmount || 0);

  return isTronAccountSolvent(tronWeb, tokenAddress, totalAmount);
}

/**
 * Approves the ERC20FeeProxy contract to spend TRC20 tokens for a request payment
 */
export async function approveTronFeeProxyRequest(
  request: ClientTypes.IRequestData,
  tronWeb: TronWeb,
  amount?: BigNumberish,
  callback?: ITronTransactionCallback,
): Promise<string> {
  const network = request.currencyInfo.network;
  if (!network || !TronChains.isChainSupported(network)) {
    throw new Error('Request currency network is not a supported Tron network');
  }
  TronChains.assertChainSupported(network);

  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  const tokenAddress = request.currencyInfo.value;
  const { feeAmount } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const totalAmount = BigNumber.from(amountToPay).add(feeAmount || 0);

  return approveTrc20(tronWeb, tokenAddress, network, totalAmount, callback);
}

/**
 * Processes a TRC20 fee proxy payment for a Request.
 *
 * @param request The request to pay
 * @param tronWeb The TronWeb instance connected to the payer's wallet
 * @param amount Optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount Optionally, the fee amount to pay. Defaults to the fee amount from the request.
 * @param callback Optional callbacks for transaction events
 * @returns The transaction hash
 */
export async function payTronFeeProxyRequest(
  request: ClientTypes.IRequestData,
  tronWeb: TronWeb,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  callback?: ITronTransactionCallback,
): Promise<string> {
  const network = request.currencyInfo.network;
  if (!network || !TronChains.isChainSupported(network)) {
    throw new Error('Request currency network is not a supported Tron network');
  }
  TronChains.assertChainSupported(network);

  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount: requestFeeAmount,
  } = getRequestPaymentValues(request);

  validatePaymentReference(paymentReference);

  if (!isValidTronAddress(paymentAddress)) {
    throw new Error(`Invalid Tron payment address: ${paymentAddress}`);
  }

  const tokenAddress = request.currencyInfo.value;
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = feeAmount ?? requestFeeAmount ?? '0';

  // Check allowance
  const totalAmount = BigNumber.from(amountToPay).add(feeToPay);
  const allowance = await getTronAllowance(tronWeb, tokenAddress, network);

  if (allowance.lt(totalAmount)) {
    throw new Error(
      `Insufficient TRC20 allowance. Required: ${totalAmount.toString()}, Available: ${allowance.toString()}. ` +
        `Please call approveTronFeeProxyRequest first.`,
    );
  }

  // Check balance
  const hasSufficientBalance = await isTronAccountSolvent(tronWeb, tokenAddress, totalAmount);
  if (!hasSufficientBalance) {
    throw new Error('Insufficient TRC20 token balance for payment');
  }

  return processTronFeeProxyPayment(
    tronWeb,
    network,
    tokenAddress,
    paymentAddress,
    amountToPay,
    paymentReference,
    feeToPay,
    feeAddress || tronWeb.defaultAddress.base58,
    callback,
  );
}

/**
 * Gets information needed to pay a Tron request
 */
export function getTronPaymentInfo(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): {
  proxyAddress: string;
  tokenAddress: string;
  paymentAddress: string;
  amount: string;
  paymentReference: string;
  feeAmount: string;
  feeAddress: string;
} {
  const network = request.currencyInfo.network;
  if (!network || !TronChains.isChainSupported(network)) {
    throw new Error('Request currency network is not a supported Tron network');
  }
  TronChains.assertChainSupported(network);

  const { paymentReference, paymentAddress, feeAddress, feeAmount } =
    getRequestPaymentValues(request);

  const tokenAddress = request.currencyInfo.value;
  const amountToPay = getAmountToPay(request, amount);
  const proxyAddress = getERC20FeeProxyAddress(network);

  return {
    proxyAddress,
    tokenAddress,
    paymentAddress,
    amount: amountToPay.toString(),
    paymentReference: paymentReference ?? '',
    feeAmount: (feeAmount || '0').toString(),
    feeAddress: feeAddress ?? '',
  };
}
