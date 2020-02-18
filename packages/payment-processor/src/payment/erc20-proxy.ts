import { ContractTransaction, Signer, utils } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumber, BigNumberish } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { ERC20Contract } from '../contracts/Erc20Contract';
import { Erc20ProxyContract } from '../contracts/Erc20ProxyContract';
import {
  getAmountToPay,
  getNetworkProvider,
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
 */
export async function payErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): Promise<ContractTransaction> {
  const encodedTx = encodePayErc20Request(request, signerOrProvider, amount);
  const proxyAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  });
  return tx;
}

/**
 * Encodes the call to pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param multisigAddress multisig contract used to pay the request.
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
  const allowance = await erc20Contract.allowance(
    account,
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
  );
  return allowance.gt(request.expectedAmount);
}

/**
 * Processes the approval transaction of the targeted ERC20.
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param provider the web3 provider. Defaults to Etherscan.
 */
export async function approveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;

  const encodedTx = encodeApproveErc20(request, signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: tokenAddress,
    value: 0,
  });
  return tx;
}

/**
 * Encodes the approval call, can be used with a Multisig contract.
 * @param request the request to pay
 * @param multisigAddress multisig contract for which to approve the ERC20
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeApproveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const tokenAddress = request.currencyInfo.value;
  const erc20interface = ERC20Contract.connect(tokenAddress, signer).interface;
  const encodedApproveCall = erc20interface.functions.approve.encode([
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    utils
      .bigNumberify(2)
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
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const contractAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const amountToPay = getAmountToPay(request, amount);
  const parameters = `transferFromWithReference?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}`;
  return `ethereum:${contractAddress}/${parameters}`;
}
