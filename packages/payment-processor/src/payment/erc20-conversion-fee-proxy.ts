import { constants, ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { proxyChainlinkConversionPath, chainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { ClientTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { ProxyChainlinkConversionPathContract } from '../contracts/ProxyChainlinkConversionPath';
import { ChainlinkConversionPath } from '../contracts/ChainlinkConversionPath';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  // validateErc20FeeProxyRequest,
} from './utils';

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param request
 * @param tokenAddress token address to pay with
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payConversionErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  tokenAddress: string,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = await encodePayConversionErc20FeeRequest(request, tokenAddress, signerOrProvider, amount, feeAmount);
  // TODO network
  const proxyAddress = proxyChainlinkConversionPath.getAddress('private');
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
 * @param tokenAddress token address to pay with
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function encodePayConversionErc20FeeRequest(
  request: ClientTypes.IRequestData,
  tokenAddress: string,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<string> {
  // TODO !
  // validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const signer = getSigner(signerOrProvider);
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  // get the conversion path
  const path = getConversionPath(request.currencyInfo, tokenAddress);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = bigNumberify(feeAmountOverride || feeAmount || 0);
  // TODO network
  const proxyAddress = proxyChainlinkConversionPath.getAddress('private');
  const proxyContract = ProxyChainlinkConversionPathContract.connect(proxyAddress, signer);

  // Compute conversion
  // TODO network
  const conversionPathContractAddress = chainlinkConversionPath.getAddress('private');
  const conversionPathContract = ChainlinkConversionPath.connect(conversionPathContractAddress, signer);
  const conversion = await conversionPathContract.functions.getConversion(amountToPay.add(feeToPay), path);
  // TODO define percentage !
  // tslint:disable-next-line:no-magic-numbers
  const maxToSpend = bigNumberify(conversion.result).mul(110).div(100);
  // TODO define timestamp limit !
  // conversion.oldestRateTimestamp

  return proxyContract.interface.functions.transferFromWithReferenceAndFee.encode([
    paymentAddress,
    amountToPay,
    path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    maxToSpend,
  ]);
}


/**
 * Get the conversion path between the request currency and the payment token address
 *
 * @param requestCurrency currency of the request
 * @param tokenAddress address of the token to pay with
 * @return path of the conversion
 */
export function getConversionPath(
  requestCurrency: RequestLogicTypes.ICurrency,
  tokenAddress: string,
): string[] {
  // TODO !
  return [Utils.currency.getCurrencyHash(requestCurrency), tokenAddress];
}






// /**
//  * Return the EIP-681 format URL with the transaction to pay an ERC20
//  * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
//  *
//  * @param request
//  * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
//  * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
//  */
// export function _getErc20FeeProxyPaymentUrl(
//   request: ClientTypes.IRequestData,
//   amount?: BigNumberish,
//   feeAmountOverride?: BigNumberish,
// ): string {
//   validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
//   const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
//     request,
//   );
//   const contractAddress = proxyChainlinkConversionPath.getAddress(request.currencyInfo.network!);
//   const amountToPay = getAmountToPay(request, amount);
//   const feeToPay = feeAmountOverride || bigNumberify(feeAmount || 0);
//   const parameters = `transferFromWithReferenceAndFee?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}&uint256=${feeToPay}&address=${feeAddress}`;
//   return `ethereum:${contractAddress}/${parameters}`;
// }
