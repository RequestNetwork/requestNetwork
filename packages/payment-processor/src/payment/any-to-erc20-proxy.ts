import { constants, ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { getDecimalsForCurrency, getConversionPath } from '@requestnetwork/currency';
import { proxyChainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { ClientTypes, RequestLogicTypes } from '@requestnetwork/types';

import { ProxyChainlinkConversionPathContract } from '../contracts/ProxyChainlinkConversionPath';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateConversionFeeProxyRequest,
} from './utils';

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param request the request to pay
 * @param paymentTokenAddress the token address to pay the request
 * @param maxToSpend maximum of token the user is willing to spend
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param network optionally, network of the payment. Defaults to 'mainnet'
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  maxToSpend: BigNumberish,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  network: string = 'mainnet',
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = await encodePayAnyToErc20ProxyRequest(
    request,
    paymentTokenAddress,
    maxToSpend,
    signerOrProvider,
    amount,
    feeAmount,
    network,
  );
  const proxyAddress = proxyChainlinkConversionPath.getAddress(network);
  const signer = getSigner(signerOrProvider);

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
 * @param paymentTokenAddress token address to pay with
 * @param maxToSpend maximum of token the user is willing to spend
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 * @param network optionally, network of the payment. Defaults to 'mainnet'
 */
export async function encodePayAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  maxToSpend: BigNumberish,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
  network: string = 'mainnet',
): Promise<string> {
  // get the conversion path
  // Compute the path automatically
  const paymentCurrency = { type: RequestLogicTypes.CURRENCY.ERC20, value: paymentTokenAddress };
  const path = getConversionPath(request.currencyInfo, paymentCurrency, network);
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${request.currencyInfo} to ${paymentCurrency}`,
    );
  }

  // Check request
  validateConversionFeeProxyRequest(request, path, amount, feeAmountOverride);

  const signer = getSigner(signerOrProvider);
  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount,
    maxRateTimespan,
  } = getRequestPaymentValues(request);

  const chainlinkDecimal = 8;
  const decimalPadding = chainlinkDecimal - getDecimalsForCurrency(request.currencyInfo);

  // tslint:disable-next-line:no-magic-numbers
  const amountToPay = getAmountToPay(request, amount).mul(10 ** decimalPadding);

  // tslint:disable-next-line:no-magic-numbers
  const feeToPay = bigNumberify(feeAmountOverride || feeAmount || 0).mul(10 ** decimalPadding);
  const proxyAddress = proxyChainlinkConversionPath.getAddress(network);
  const proxyContract = ProxyChainlinkConversionPathContract.connect(proxyAddress, signer);

  return proxyContract.interface.functions.transferFromWithReferenceAndFee.encode([
    paymentAddress,
    amountToPay,
    path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    maxToSpend,
    maxRateTimespan || 0,
  ]);
}
