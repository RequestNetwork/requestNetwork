import { ContractTransaction, Signer } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { BigNumberish } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { Erc20ProxyContract } from '../contracts/Erc20ProxyContract';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';

/**
 * Processes a transaction to pay an ERC20 Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayErc20Request(request, signerOrProvider, amount);
  const proxyAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
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
 * Encodes the call to pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodePayErc20Request(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const tokenAddress = request.currencyInfo.value;
  const proxyAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);

  const proxyContract = Erc20ProxyContract.connect(proxyAddress, signer);
  return proxyContract.interface.functions.transferFromWithReference.encode([
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function _getErc20ProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const contractAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const amountToPay = getAmountToPay(request, amount);
  const parameters = `transferFromWithReference?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}`;
  return `ethereum:${contractAddress}/${parameters}`;
}
