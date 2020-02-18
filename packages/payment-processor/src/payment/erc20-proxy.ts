import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumber, bigNumberify, BigNumberish } from 'ethers/utils';

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
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const signer = getSigner(signerOrProvider);

  const proxyContract = Erc20ProxyContract.connect(
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    signer,
  );

  const amountToPay = getAmountToPay(request, amount);

  const tx = await proxyContract.transferFromWithReference(
    request.currencyInfo.value,
    paymentAddress,
    amountToPay,
    '0x' + paymentReference,
  );
  return tx;
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
  const erc20Contract = ERC20Contract.connect(request.currencyInfo.value, signer);

  const tx = await erc20Contract.approve(
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    bigNumberify(2)
      // tslint:disable-next-line: no-magic-numbers
      .pow(256)
      .sub(1),
  );
  return tx;
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
