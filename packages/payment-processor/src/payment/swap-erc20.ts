import { BigNumber, BigNumberish, ContractTransaction, providers, Signer } from 'ethers';

import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides.js';
import { getProvider, getSigner } from './utils.js';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20/index.js';
import { IPreparedTransaction } from './prepared-transaction.js';
import { EvmChains } from '@requestnetwork/currency';

/**
 * Processes the approval transaction of a given payment ERC20 to be spent by the swap router,
 * if the current approval is missing or not sufficient.
 * @param request request to pay, used to know the network
 * @param ownerAddress address of the payer
 * @param paymentCurrency ERC20 currency used for the swap
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param minAmount ensures the approved amount is sufficient to pay this amount
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20ForSwapToPayIfNeeded(
  request: ClientTypes.IRequestData,
  ownerAddress: string,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  minAmount: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (
    !(await hasApprovalErc20ForSwapToPay(
      request,
      ownerAddress,
      paymentTokenAddress,
      signerOrProvider,
      minAmount,
    ))
  ) {
    return approveErc20ForSwapToPay(request, paymentTokenAddress, signerOrProvider, overrides);
  }
}

/**
 * Verify if a given payment ERC20 can be spent by the swap router,
 * @param request request to pay, used to know the network
 * @param ownerAddress address of the payer
 * @param paymentCurrency ERC20 currency used for the swap
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param minAmount ensures the approved amount is sufficient to pay this amount
 */
export async function hasApprovalErc20ForSwapToPay(
  request: ClientTypes.IRequestData,
  ownerAddress: string,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  minAmount: BigNumberish,
): Promise<boolean> {
  const { network } = request.currencyInfo;
  if (!network) {
    throw new Error('Request currency network is missing');
  }
  EvmChains.assertChainSupported(network);
  return checkErc20Allowance(
    ownerAddress,
    erc20SwapToPayArtifact.getAddress(network),
    signerOrProvider,
    paymentTokenAddress,
    minAmount,
  );
}

/**
 * Processes the approval transaction of the payment ERC20 to be spent by the swap router.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency for the swap to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20ForSwapToPay(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApprovalErc20ForSwapToPay(
    request,
    paymentTokenAddress,
    signerOrProvider,
    overrides,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction for allowing the swap router to spend ERC20 payment tokens.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency for the swap to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareApprovalErc20ForSwapToPay(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
  amount?: BigNumber,
): IPreparedTransaction {
  const { network } = request.currencyInfo;
  EvmChains.assertChainSupported(network!);
  const encodedTx = encodeApproveAnyErc20(
    paymentTokenAddress,
    erc20SwapToPayArtifact.getAddress(network),
    signerOrProvider,
    amount,
  );
  return {
    data: encodedTx,
    to: paymentTokenAddress,
    value: 0,
    ...overrides,
  };
}
