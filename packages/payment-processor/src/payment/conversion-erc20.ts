import { ContractTransaction, Signer, BigNumberish, providers, BigNumber } from 'ethers';

import { AnyToERC20PaymentDetector } from '@requestnetwork/payment-detection';
import { ClientTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import { getProvider, getSigner, getProxyAddress } from './utils';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';
import { IPreparedTransaction } from './prepared-transaction';

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
  if (
    !(await hasErc20ApprovalForProxyConversion(
      request,
      ownerAddress,
      paymentTokenAddress,
      signerOrProvider,
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
 * Verify if a given payment ERC20 can be spent by the conversion proxy,
 * @param request request to pay, used to know the network
 * @param ownerAddress address of the payer
 * @param paymentTokenAddress ERC20 currency used to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param minAmount ensures the approved amount is sufficient to pay this amount
 */
export async function hasErc20ApprovalForProxyConversion(
  request: ClientTypes.IRequestData,
  ownerAddress: string,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  minAmount: BigNumberish,
): Promise<boolean> {
  const proxyAddress = getProxyAddress(request, AnyToERC20PaymentDetector.getDeploymentInformation);
  return checkErc20Allowance(
    ownerAddress,
    proxyAddress,
    signerOrProvider,
    paymentTokenAddress,
    minAmount,
  );
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
  const preparedTx = prepareApproveErc20ForProxyConversion(
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
 * Prepare the approval transaction of the payment ERC20 to be spent by the conversion proxy,
 * during the fee proxy delegate call.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20ForProxyConversion(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
  amount?: BigNumber,
): IPreparedTransaction {
  const proxyAddress = getProxyAddress(request, AnyToERC20PaymentDetector.getDeploymentInformation);
  const encodedTx = encodeApproveAnyErc20(
    paymentTokenAddress,
    proxyAddress,
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
