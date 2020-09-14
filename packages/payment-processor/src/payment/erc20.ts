import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumber, bigNumberify, BigNumberish } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { ERC20Contract } from '../contracts/Erc20Contract';
import { _getErc20FeeProxyPaymentUrl, payErc20FeeProxyRequest } from './erc20-fee-proxy';
import { _getErc20ProxyPaymentUrl, payErc20ProxyRequest } from './erc20-proxy';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getNetworkProvider,
  getPaymentNetworkExtension,
  getProvider,
  getSigner,
  validateRequest,
} from './utils';

/**
 * Processes a transaction to pay an ERC20 Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Only applicable to ERC20 Fee Payment network. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20Request(
  request: ClientTypes.IRequestData,
  signerOrProvider?: Web3Provider | Signer,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT) {
    return payErc20ProxyRequest(request, signerOrProvider, amount, overrides);
  }
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    return payErc20FeeProxyRequest(request, signerOrProvider, amount, feeAmount, overrides);
  }
  throw new Error('Not a supported ERC20 proxy payment network request');
}

/**
 * Checks if a given account has the necessary allowance to pay an ERC20 request.
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param provider the web3 provider. Defaults to Etherscan.
 */
export async function hasErc20Approval(
  request: ClientTypes.IRequestData,
  account: string,
  provider: Provider = getNetworkProvider(request),
): Promise<boolean> {
  const erc20Contract = ERC20Contract.connect(request.currencyInfo.value, provider);
  const allowance = await erc20Contract.allowance(account, getProxyAddress(request));
  return allowance.gt(request.expectedAmount);
}

/**
 * Processes the approval transaction of the targeted ERC20.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 * @param paymentNetworkId the payment network id
 * @param proxyContractAddress the address of the proxy contract to set the approval.
 */
export async function approveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeApproveErc20(request, signerOrProvider);
  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: tokenAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the approval call, can be used with a Multisig contract.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param proxyContractAddress the address of the proxy contract to set the approval.
 */
export function encodeApproveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
): string {
  const paymentNetworkId = (getPaymentNetworkExtension(request)
    ?.id as unknown) as PaymentTypes.PAYMENT_NETWORK_ID;
  if (!paymentNetworkId) {
    throw new Error('No payment network Id');
  }
  validateRequest(request, paymentNetworkId);
  const signer = getSigner(signerOrProvider);

  const proxyAddress = getProxyAddress(request);
  const tokenAddress = request.currencyInfo.value;
  const erc20interface = ERC20Contract.connect(tokenAddress, signer).interface;
  const encodedApproveCall = erc20interface.functions.approve.encode([
    proxyAddress,
    bigNumberify(2)
      // tslint:disable-next-line: no-magic-numbers
      .pow(256)
      .sub(1),
  ]);
  return encodedApproveCall;
}

/**
 * Gets ERC20 balance of an address, based on the request currency information
 * @param request the request that contains currency information
 * @param address the address to check
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getErc20Balance(
  request: ClientTypes.IRequestData,
  address: string,
  provider: Provider = getNetworkProvider(request),
): Promise<BigNumber> {
  const erc20Contract = ERC20Contract.connect(request.currencyInfo.value, provider);
  return erc20Contract.balanceOf(address);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function _getErc20PaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): string {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT) {
    return _getErc20ProxyPaymentUrl(request, amount);
  }
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    return _getErc20FeeProxyPaymentUrl(request, amount);
  }
  throw new Error('Not a supported ERC20 proxy payment network request');
}

/**
 * Get the request payment network proxy address
 * @param request
 * @returns the payment network proxy address
 */
function getProxyAddress(request: ClientTypes.IRequestData): string {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT) {
    return erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  }
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    return erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  }
  if (id === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED) {
    throw new Error(`ERC20 address based payment network doesn't need approval`);
  }
  throw new Error(`Unsupported payment network: ${id}`);
}
