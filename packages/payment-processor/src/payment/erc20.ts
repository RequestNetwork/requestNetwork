import { ContractTransaction, Signer, BigNumber, BigNumberish, providers } from 'ethers';

import { Erc20PaymentNetwork, getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { _getErc20FeeProxyPaymentUrl, payErc20FeeProxyRequest } from './erc20-fee-proxy';
import { _getErc20ProxyPaymentUrl, payErc20ProxyRequest } from './erc20-proxy';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getNetworkProvider,
  getProvider,
  getProxyAddress as genericGetProxyAddress,
  getSigner,
  MAX_ALLOWANCE,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Processes a transaction to pay an ERC20 Request.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Only applicable to ERC20 Fee Payment network. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 * @param swapSettings optionally, the settings to swap a maximum amount of currency, through a swap path, before a deadline, to pay
 */
export async function payErc20Request(
  request: ClientTypes.IRequestData,
  signerOrProvider?: providers.Provider | Signer,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
  swapSettings?: any,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (swapSettings && id !== ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    throw new Error(`ExtensionType: ${id} is not supported by swapToPay contract`);
  }
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT) {
    return payErc20ProxyRequest(request, signerOrProvider, amount, overrides);
  }
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
     return payErc20FeeProxyRequest(request, signerOrProvider, amount, feeAmount, overrides);
  }
  throw new Error('Not a supported ERC20 proxy payment network request');
}

/**
 * Checks if the proxy has the necessary allowance from a given account to pay a given request with ERC20
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param provider the web3 provider. Defaults to Etherscan.
 */
export async function hasErc20Approval(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getNetworkProvider(request),
): Promise<boolean> {
  return checkErc20Allowance(
    account,
    getProxyAddress(request),
    signerOrProvider,
    request.currencyInfo.value,
    request.expectedAmount,
  );
}

/**
 * Retrieves the allowance given by an ERC20 token owner to a spender.
 * @param ownerAddress address of the owner
 * @param spenderAddress address of the spender
 * @param signerOprovider the web3 provider
 * @param tokenAddress Address of the ERC20 token
 */
export async function getErc20Allowance(
  ownerAddress: string,
  spenderAddress: string,
  signerOrProvider: providers.Provider | Signer,
  tokenAddress: string,
): Promise<BigNumber> {
  const erc20Contract = ERC20__factory.connect(tokenAddress, signerOrProvider);
  return await erc20Contract.allowance(ownerAddress, spenderAddress);
}

/**
 * Checks if a spender has enough allowance from an ERC20 token owner to pay an amount.
 * @param ownerAddress address of the owner
 * @param spenderAddress address of the spender
 * @param signerOrProvider the web3 provider.
 * @param tokenAddress Address of the ERC20 currency
 * @param amount The amount to check the allowance for
 */
export async function checkErc20Allowance(
  ownerAddress: string,
  spenderAddress: string,
  signerOrProvider: providers.Provider | Signer,
  tokenAddress: string,
  amount: BigNumberish,
): Promise<boolean> {
  const allowance = await getErc20Allowance(
    ownerAddress,
    spenderAddress,
    signerOrProvider,
    tokenAddress,
  );
  return allowance.gte(amount);
}

/**
 * Processes the approval transaction of the targeted ERC20.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20IfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getNetworkProvider(request),
  overrides?: ITransactionOverrides,
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<ContractTransaction | void> {
  if (!(await hasErc20Approval(request, account, signerOrProvider))) {
    return approveErc20(request, getSigner(signerOrProvider), overrides, amount);
  }
}

/**
 * Processes the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
  amount: BigNumber = MAX_ALLOWANCE,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20(request, signerOrProvider, overrides, amount);
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
  amount: BigNumber = MAX_ALLOWANCE,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20(request, signerOrProvider, amount);
  const tokenAddress = request.currencyInfo.value;
  return {
    data: encodedTx,
    to: tokenAddress,
    value: 0,
    ...overrides,
  };
}

/**
 * Encodes the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeApproveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount: BigNumber = MAX_ALLOWANCE,
): string {
  const paymentNetworkId = getPaymentNetworkExtension(request)?.id;
  if (!paymentNetworkId) {
    throw new Error('No payment network Id');
  }
  validateRequest(request, paymentNetworkId);
  return encodeApproveAnyErc20(
    request.currencyInfo.value,
    getProxyAddress(request),
    getSigner(signerOrProvider),
    amount,
  );
}

/**
 * Encodes the approval call to approve any erc20 token to be spent, with no limit.
 * @param tokenAddress the ERC20 token address to approve
 * @param spenderAddress the address granted the approval
 * @param signerOrProvider the signer who owns ERC20 tokens
 * @param amount default to max allowance
 */
export function encodeApproveAnyErc20(
  tokenAddress: string,
  spenderAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount: BigNumber = MAX_ALLOWANCE,
): string {
  if (amount.gt(MAX_ALLOWANCE)) {
    throw new Error('Invalid amount');
  }
  const erc20interface = ERC20__factory.connect(tokenAddress, signerOrProvider).interface;
  return erc20interface.encodeFunctionData('approve', [spenderAddress, amount]);
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
  provider: providers.Provider = getNetworkProvider(request),
): Promise<BigNumberish> {
  return getAnyErc20Balance(request.currencyInfo.value, address, provider);
}

/**
 * Gets any ERC20 balance of an address
 * @param anyErc20Address the currency address
 * @param address the address to check
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getAnyErc20Balance(
  anyErc20Address: string,
  address: string,
  provider: providers.Provider,
): Promise<BigNumberish> {
  const erc20Contract = ERC20__factory.connect(anyErc20Address, provider);
  return erc20Contract.balanceOf(address);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function _getErc20PaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): Promise<string> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT) {
    return _getErc20ProxyPaymentUrl(request, amount);
  }
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    return _getErc20FeeProxyPaymentUrl(request, amount);
  }
  throw new Error('Not a supported ERC20 proxy payment network request');
}

/**
 * Get the request payment network proxy address
 * @returns the payment network proxy address
 */
function getProxyAddress(request: ClientTypes.IRequestData): string {
  const pn = getPaymentNetworkExtension(request);
  const id = pn?.id;
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED) {
    throw new Error(`ERC20 address based payment network doesn't need approval`);
  }

  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT) {
    return genericGetProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
    );
  }
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    return genericGetProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector.getDeploymentInformation,
    );
  }
  if (id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE) {
    return genericGetProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20TransferableReceivablePaymentDetector.getDeploymentInformation,
    );
  }

  throw new Error(`Unsupported payment network: ${id}`);
}
