import { ContractTransaction, Signer, providers, BigNumberish, BigNumber } from 'ethers';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';

import { getNetworkProvider, getProvider, validateRequest, MAX_ALLOWANCE } from './utils';
import Token from '@superfluid-finance/sdk-core/dist/module/Token';
import { getSuperFluidFramework } from './erc777-stream';
import Operation from '@superfluid-finance/sdk-core/dist/module/Operation';
import { checkErc20Allowance, encodeApproveAnyErc20, getAnyErc20Balance } from './erc20';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Gets the underlying token address of an ERC777 currency based request
 * @param request the request that contains currency information
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getRequestUnderlyingToken(
  request: ClientTypes.IRequestData,
  provider: providers.Provider = getNetworkProvider(request),
): Promise<Token> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM);
  const sf = await getSuperFluidFramework(request, provider);
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  return superToken.underlyingToken;
}

/**
 * Gets the underlying token address of an ERC777 currency based request
 * @param request the request that contains currency information
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getUnderlyingTokenBalanceOf(
  request: ClientTypes.IRequestData,
  address: string,
  provider: providers.Provider = getNetworkProvider(request),
): Promise<BigNumberish> {
  const underlyingToken = await getRequestUnderlyingToken(request, provider);
  return getAnyErc20Balance(underlyingToken.address, address, provider);
}

/**
 * Check if the user has the specified amount of underlying token
 * @param request the request that contains currency information
 * @param address token owner
 * @param provider the web3 provider. Defaults to Etherscan
 * @param amount the required amount
 */
export async function hasEnoughUnderlyingToken(
  request: ClientTypes.IRequestData,
  address: string,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber,
): Promise<boolean> {
  const balance = await getUnderlyingTokenBalanceOf(request, address, provider);
  return amount.lte(balance);
}

/**
 * Determine whether or not the supertoken has enough allowance
 * @param request the request that contains currency information
 * @param address token owner
 * @param provider the web3 provider. Defaults to Etherscan
 * @param amount of token required
 */
export async function checkSuperTokenUnderlyingAllowance(
  request: ClientTypes.IRequestData,
  address: string,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<boolean> {
  const underlyingToken = await getRequestUnderlyingToken(request, provider);
  return checkErc20Allowance(
    address,
    request.currencyInfo.value,
    provider,
    underlyingToken.address,
    amount,
  );
}

/**
 * Get the SF operation to approve the supertoken to spend underlying tokens
 * @param request the request that contains currency information
 * @param provider the web3 provider. Defaults to Etherscan
 * @param amount to allow, defalts to max allowance
 */
export async function prepareApproveUnderlyingToken(
  request: ClientTypes.IRequestData,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<IPreparedTransaction> {
  const underlyingToken = await getRequestUnderlyingToken(request, provider);
  return {
    data: encodeApproveAnyErc20(
      underlyingToken.address,
      request.currencyInfo.value,
      provider,
      amount,
    ),
    to: underlyingToken.address,
    value: 0,
  };
}

/**
 * Get the SF operation to Wrap the underlying asset into supertoken
 * @param request the request that contains currency information
 * @param address the user address
 * @param provider the web3 provider
 * @param amount to allow, defalts to max allowance
 */
export async function getWrapUnderlyingTokenOp(
  request: ClientTypes.IRequestData,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber,
): Promise<Operation> {
  const sf = await getSuperFluidFramework(request, provider);
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  return superToken.upgrade({
    amount: amount.toString(),
  });
}

/**
 * Approve the supertoken to spend the speicified amount of underlying token
 * @param request the request that contains currency information
 * @param signer the web3 signer
 * @param amount to allow, defaults to max allowance
 * @returns
 */
export async function approveUnderlyingToken(
  request: ClientTypes.IRequestData,
  signer: Signer,
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<ContractTransaction> {
  if (
    !(await hasEnoughUnderlyingToken(
      request,
      await signer.getAddress(),
      signer.provider ?? getProvider(),
      amount,
    ))
  ) {
    throw new Error('Sender does not have enough underlying token');
  }
  const preparedTx = await prepareApproveUnderlyingToken(
    request,
    signer.provider ?? getProvider(),
    amount,
  );
  return signer.sendTransaction(preparedTx);
}

/**
 * Prepare the wrap transaction of the specified amount of underlying token into supertoken
 * @param request the request that contains currency information
 * @param provider the web3 provider
 * @param amount to allow, defaults to max allowance
 * @returns
 */
export async function prepareWrapUnderlyingToken(
  request: ClientTypes.IRequestData,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<IPreparedTransaction> {
  const wrapOp = await getWrapUnderlyingTokenOp(request, provider, amount);
  return (await wrapOp.populateTransactionPromise) as IPreparedTransaction;
}

/**
 * Wrap the speicified amount of underlying token into supertokens
 * @param request the request that contains currency information
 * @param signer the web3 signer
 * @param amount to allow, defaults to max allowance
 * @returns
 */
export async function wrapUnderlyingToken(
  request: ClientTypes.IRequestData,
  signer: Signer,
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<ContractTransaction> {
  const senderAddress = await signer.getAddress();
  const provider = signer.provider ?? getProvider();
  if (!(await checkSuperTokenUnderlyingAllowance(request, senderAddress, provider, amount))) {
    throw new Error('Supertoken not allowed to wrap this amount of underlying');
  }
  if (!(await hasEnoughUnderlyingToken(request, senderAddress, provider, amount))) {
    throw new Error('Sender does not have enough underlying token');
  }
  const preparedTx = await prepareWrapUnderlyingToken(
    request,
    signer.provider ?? getProvider(),
    amount,
  );
  return signer.sendTransaction(preparedTx);
}

/**
 * Prepare the unwrapping transaction of the supertoken (ERC777) into underlying asset (ERC20)
 * @param request the request that contains currency information
 * @param provider the web3 provider
 * @param amount to unwrap
 */
export async function prepareUnwrapSuperToken(
  request: ClientTypes.IRequestData,
  provider: providers.Provider = getNetworkProvider(request),
  amount: BigNumber,
): Promise<IPreparedTransaction> {
  const sf = await getSuperFluidFramework(request, provider);
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const underlyingToken = await getRequestUnderlyingToken(request, provider);

  if (underlyingToken.address === superToken.address) {
    throw new Error('This is a native super token');
  }

  const downgradeOp = superToken.downgrade({
    amount: amount.toString(),
  });
  return (await downgradeOp.populateTransactionPromise) as IPreparedTransaction;
}

/**
 * Unwrap the supertoken (ERC777) into underlying asset (ERC20)
 * @param request the request that contains currency information
 * @param signer the web3 signer
 * @param amount to unwrap
 */
export async function unwrapSuperToken(
  request: ClientTypes.IRequestData,
  signer: Signer,
  amount: BigNumber,
): Promise<ContractTransaction> {
  const sf = await getSuperFluidFramework(request, signer.provider ?? getProvider());
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const userAddress = await signer.getAddress();
  const userBalance = await superToken.balanceOf({
    account: userAddress,
    providerOrSigner: signer.provider ?? getProvider(),
  });
  if (amount.gt(userBalance)) {
    throw new Error('Sender does not have enough supertoken');
  }
  const preparedTx = await prepareUnwrapSuperToken(
    request,
    signer.provider ?? getProvider(),
    amount,
  );
  return signer.sendTransaction(preparedTx);
}
