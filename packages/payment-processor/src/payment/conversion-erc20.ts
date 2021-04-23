import { ContractTransaction, Signer, BigNumberish, providers } from 'ethers';

import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import { getProvider, getSigner } from './utils';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';

/**
 * Processes the approval transaction of a given payment ERC20 to be spent by the conversion proxy,
 * if the current approval is missing or not sufficient.
 * @param request request to pay, used to know the network
 * @param ownerAddress address of the payer
 * @param paymentTokenAddress ERC20 currency used to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param minAmount ensures the approved amount is sufficient to pay this amount
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20ForProxyConversionIfNeeded(
  request: ClientTypes.IRequestData,
  ownerAddress: string,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  minAmount: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  const network =
    request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY].values.network;
  if (!network) {
    throw new Error(`Payment network currency must have a network`);
  }

  if (
    !(await checkErc20Allowance(
      ownerAddress,
      erc20ConversionProxy.getAddress(network),
      signerOrProvider,
      paymentTokenAddress,
      minAmount,
    ))
  ) {
    return approveErc20ForProxyConversion(
      request,
      paymentTokenAddress,
      signerOrProvider,
      overrides,
    );
  }
}

/**
 * Processes the approval transaction of the payment ERC20 to be spent by the conversion proxy,
 * during the fee proxy delegate call.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20ForProxyConversion(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const network =
    request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY].values.network;

  const encodedTx = encodeApproveAnyErc20(
    paymentTokenAddress,
    erc20ConversionProxy.getAddress(network),
    signerOrProvider,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: paymentTokenAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}
