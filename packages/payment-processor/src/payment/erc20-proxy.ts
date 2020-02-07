import { ContractTransaction, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { BigNumber, bigNumberify } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { ERC20ContractFactory } from '../contracts/ERC20ContractFactory';
import { Erc20ProxyContractFactory } from '../contracts/Erc20ProxyContractFactory';
import { getProvider, getRequestPaymentValues, validateRequest } from './utils';

export const payErc20ProxyRequest = async (
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<ContractTransaction> => {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const proxyContract = Erc20ProxyContractFactory.connect(
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    signer,
  );
  const tx = await proxyContract.transferFromWithReference(
    request.currencyInfo.value,
    paymentAddress,
    request.expectedAmount,
    '0x' + paymentReference,
  );
  return tx;
};

export const hasErc20Approval = async (
  request: ClientTypes.IRequestData,
  address: string,
  provider: Provider = getProvider(),
): Promise<boolean> => {
  const erc20Contract = ERC20ContractFactory.connect(request.currencyInfo.value, provider);
  const allowance = await erc20Contract.allowance(
    address,
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
  );
  return allowance.gt(request.expectedAmount);
};

export const approveErc20 = async (
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<ContractTransaction> => {
  const erc20Contract = ERC20ContractFactory.connect(request.currencyInfo.value, signer);

  const tx = await erc20Contract.approve(
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    bigNumberify(2)
      // tslint:disable-next-line: no-magic-numbers
      .pow(256)
      .sub(1),
  );
  return tx;
};

export const getErc20Balance = async (
  tokenAddress: string,
  address: string,
  provider: Provider = getProvider(),
): Promise<BigNumber> => {
  const erc20Contract = ERC20ContractFactory.connect(tokenAddress, provider);
  return erc20Contract.balanceOf(address);
};

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 */
export const getErc20PaymentUrl = (request: ClientTypes.IRequestData): string => {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const contractAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const parameters = `transferFromWithReference?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${request.expectedAmount}&bytes=${paymentReference}`;
  return `ethereum:${contractAddress}/${parameters}`;
};
