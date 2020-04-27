/**
 * # Multisig payments for ERC20
 *
 * ## Pay through a proxy-contract with a multisig
 * Imports
 */

import { Contract, ContractTransaction, Signer } from 'ethers';

import {
  encodeApproveErc20,
  encodePayErc20Request,
} from '@requestnetwork/payment-processor/dist/payment/erc20-proxy';
import { getRequestPaymentValues } from '@requestnetwork/payment-processor/dist/payment/utils';
import { ClientTypes } from '@requestnetwork/types';

/**
 * [Gnosis multisig](https://github.com/gnosis/MultiSigWallet/blob/master/contracts/MultiSigWallet.sol) partial abi
 */
const multisigAbi = [
  'function submitTransaction(address _destination, uint _value, bytes _data) returns (uint)',
];

/**
 * ### Pay ETH request
 */
export const payEthWithMultisig = async (
  request: ClientTypes.IRequestData,
  multisigAddress: string,
  signer: Signer,
): Promise<ContractTransaction> => {
  const multisigContract = new Contract(multisigAddress, multisigAbi, signer);

  const { paymentAddress, paymentReference } = getRequestPaymentValues(request);
  return multisigContract.submitTransaction(paymentAddress, 0, paymentReference);
};

/**
 * ### Approve ERC20 spending
 */
export const approveErc20WithMultisig = async (
  request: ClientTypes.IRequestData,
  multisigAddress: string,
  signer: Signer,
): Promise<ContractTransaction> => {
  const multisigContract = new Contract(multisigAddress, multisigAbi, signer);
  const tokenAddress = request.currencyInfo.value;

  return multisigContract.submitTransaction(tokenAddress, 0, encodeApproveErc20(request, signer));
};
/**
 * ### Pay ERC20 request
 */
export const payErc20WithMultisig = async (
  request: ClientTypes.IRequestData,
  multisigAddress: string,
  signer: Signer,
): Promise<ContractTransaction> => {
  const multisigContract = new Contract(multisigAddress, multisigAbi, signer);
  const tokenAddress = request.currencyInfo.value;

  return multisigContract.submitTransaction(
    tokenAddress,
    0,
    encodePayErc20Request(request, signer),
  );
};
