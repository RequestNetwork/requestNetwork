import { ContractTransaction, utils } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import { ERC20Contract } from '../contracts/Erc20Contract';
import { Erc20ProxyContract } from '../contracts/Erc20ProxyContract';
import { GnosisSafeMultisigContract } from '../contracts/GnosisSafeMultisigContract';
import { getProvider, getRequestPaymentValues, getSigner, validateRequest } from './utils';

/**
 * Processes the approval transaction of the targeted ERC20, through a GnosisSafe multisig contract.
 * @param request
 * @param multisigAddress multisig contract for which to approve the ERC20
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function approveErc20WithMultisig(
  request: ClientTypes.IRequestData,
  multisigAddress: string,
  signerOrProvider: Web3Provider = getProvider(),
): Promise<ContractTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const multisigContract = GnosisSafeMultisigContract.connect(multisigAddress, signer);
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
  return multisigContract.submitTransaction(tokenAddress, 0, encodedApproveCall);
}
/**
 * Pay an ERC20 request using a Multisig contract.
 * @param request request to pay
 * @param multisigAddress multisig contract used to pay the request.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function payErc20WithMultisig(
  request: ClientTypes.IRequestData,
  multisigAddress: string,
  signerOrProvider: Web3Provider = getProvider(),
): Promise<ContractTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const multisigContract = GnosisSafeMultisigContract.connect(multisigAddress, signer);
  const tokenAddress = request.currencyInfo.value;
  const proxyAddress = erc20ProxyArtifact.getAddress(request.currencyInfo.network!);
  const erc20ProxyInterface = Erc20ProxyContract.connect(proxyAddress, signer).interface;

  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  const encodedApproveCall = erc20ProxyInterface.functions.transferFromWithReference.encode([
    tokenAddress,
    paymentAddress,
    request.expectedAmount,
    `0x${paymentReference}`,
  ]);
  return multisigContract.submitTransaction(multisigAddress, 0, encodedApproveCall);
}
