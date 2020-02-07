import { ContractTransaction, utils } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';

import { ERC20ContractFactory } from '../contracts/ERC20ContractFactory';
import { Erc20ProxyContractFactory } from '../contracts/Erc20ProxyContractFactory';
import { MultisigContractFactory } from '../contracts/MultisigContractFactory';
import { getProvider, getRequestPaymentValues } from './utils';

export const approveErc20WithMultisig = async (
  request: ClientTypes.IRequestData,
  account: string,
  multisigAddress: string,
  provider: Web3Provider = getProvider(),
): Promise<ContractTransaction> => {
  const signer = provider.getSigner(account);

  const multisigContract = MultisigContractFactory.connect(multisigAddress, signer);
  const tokenAddress = request.currencyInfo.value;
  const erc20interface = ERC20ContractFactory.connect(tokenAddress, provider).interface;
  const encodedApproveCall = erc20interface.functions.approve.encode([
    erc20ProxyArtifact.getAddress(request.currencyInfo.network!),
    utils
      .bigNumberify(2)
      // tslint:disable-next-line: no-magic-numbers
      .pow(256)
      .sub(1),
  ]);
  return multisigContract.submitTransaction(tokenAddress, 0, encodedApproveCall);
};

export const payErc20WithMultisig = async (
  request: ClientTypes.IRequestData,
  account: string,
  multisigAddress: string,
  provider: Web3Provider = getProvider(),
): Promise<ContractTransaction> => {
  const signer = provider.getSigner(account);

  const multisigContract = MultisigContractFactory.connect(multisigAddress, signer);
  const tokenAddress = request.currencyInfo.value;
  const proxyAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const erc20ProxyInterface = Erc20ProxyContractFactory.connect(proxyAddress, provider).interface;

  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const encodedApproveCall = erc20ProxyInterface.functions.transferFromWithReference.encode([
    tokenAddress,
    paymentAddress,
    request.expectedAmount,
    `0x${paymentReference}`,
  ]);
  return multisigContract.submitTransaction(multisigAddress, 0, encodedApproveCall);
};
