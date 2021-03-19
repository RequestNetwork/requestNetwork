import { ContractTransaction, providers, Signer, BigNumberish } from 'ethers';

import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';

import { _getErc20FeeProxyPaymentUrl } from './erc20-fee-proxy';
import { _getErc20ProxyPaymentUrl } from './erc20-proxy';

import { ITransactionOverrides } from './transaction-overrides';
import { getProvider, getSigner } from './utils';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';

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
  if (!request.currencyInfo.network) {
    throw new Error('Request currency network is missing');
  }
  if (
    !(await checkErc20Allowance(
      ownerAddress,
      erc20SwapToPayArtifact.getAddress(request.currencyInfo.network),
      signerOrProvider,
      paymentTokenAddress,
      minAmount,
    ))
  ) {
    return approveErc20ForSwapToPay(request, paymentTokenAddress, signerOrProvider, overrides);
  }
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
  const encodedTx = encodeApproveAnyErc20(
    paymentTokenAddress,
    erc20SwapToPayArtifact.getAddress(request.currencyInfo.network!),
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
