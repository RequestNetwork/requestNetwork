import { constants, ContractTransaction, Signer, BigNumber, providers } from 'ethers';

import { erc20SwapConversionArtifact } from '@requestnetwork/smart-contracts';
import { ERC20SwapToPayWithConversion__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateConversionFeeProxyRequest,
} from './utils';
import { getConversionPath } from '@requestnetwork/currency';
import { IRequestPaymentOptions } from './settings';

export { ISwapSettings } from './swap-erc20-fee-proxy';

/**
 * Processes a transaction to swap tokens and pay an ERC20 Request through a proxy with fees.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings settings for the swap: swap path, max amount to swap, deadline
 * @param options to override amount, feeAmount and transaction parameters
 */
export async function swapToPayAnyToErc20Request(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  options?: IRequestPaymentOptions,
): Promise<ContractTransaction> {
  const network =
    request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY].values.network ||
    'mainnet';

  const encodedTx = encodeSwapToPayAnyToErc20Request(request, signerOrProvider, options);
  const proxyAddress = erc20SwapConversionArtifact.getAddress(network);
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
 * @param settings settings for the swap and the on-chain conversion
 * @param options to override amount, feeAmount and transaction parameters
 */
export function encodeSwapToPayAnyToErc20Request(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  options?: IRequestPaymentOptions,
): string {
  const conversionSettings = options?.conversion;
  const swapSettings = options?.swap;

  if (!conversionSettings) {
    throw new Error(`Conversion Settings are required`);
  }
  if (!swapSettings) {
    throw new Error(`Swap Settings are required`);
  }
  if (!conversionSettings.currency?.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }

  /** On Chain conversion preparation */

  // Compute the path automatically
  const path = getConversionPath(
    request.currencyInfo,
    conversionSettings.currency,
    conversionSettings.currency.network,
  );
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${request.currencyInfo} to ${conversionSettings.currency}`,
    );
  }
  validateConversionFeeProxyRequest(request, path);

  const signer = getSigner(signerOrProvider);
  const paymentNetworkTokenAddress = conversionSettings.currency.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, options?.amount);
  const feeToPay = BigNumber.from(options?.feeAmount || feeAmount || 0);

  if (
    swapSettings.path[swapSettings.path.length - 1].toLowerCase() !==
    paymentNetworkTokenAddress.toLowerCase()
  ) {
    throw new Error('Last item of the path should be the payment currency');
  }
  // eslint-disable-next-line no-magic-numbers
  if (Date.now() > swapSettings.deadline * 1000) {
    throw new Error('A swap with a past deadline will fail, the transaction will not be pushed');
  }

  const contractAddress = erc20SwapConversionArtifact.getAddress(
    conversionSettings.currency?.network || 'mainnet',
  );
  const swapToPayContract = ERC20SwapToPayWithConversion__factory.connect(contractAddress, signer);

  return swapToPayContract.interface.encodeFunctionData('swapTransferWithReference', [
    paymentAddress, // _to: string,
    amountToPay, // _requestAmount: BigNumberish,
    swapSettings.maxInputAmount, // _amountInMax: BigNumberish,
    swapSettings.path, // _uniswapPath: string[],
    path, // _chainlinkPath: string[],
    `0x${paymentReference}`, // _paymentReference: BytesLike,
    feeToPay, // _requestFeeAmount: BigNumberish,
    feeAddress || constants.AddressZero, // _feeAddress: string,
    Math.round(swapSettings.deadline / 1000), // _uniswapDeadline: BigNumberish,
    0, // _chainlinkMaxRateTimespan: BigNumberish,
  ]);
}
