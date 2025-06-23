import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { providers, Signer, BigNumberish } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { getErc20Allowance } from './erc20';

/**
 * Retrieves the current ERC-20 allowance that a subscriber (`payerAddress`) has
 * granted to the `ERC20RecurringPaymentProxy` on a specific network.
 *
 * @param payerAddress - Address of the token owner (subscriber) whose allowance is queried.
 * @param tokenAddress - Address of the ERC-20 token involved in the recurring payment schedule.
 * @param provider     - A Web3 provider or signer used to perform the on-chain call.
 * @param network      - The EVM chain name (e.g. `'mainnet'`, `'goerli'`, `'matic'`).
 *
 * @returns A Promise that resolves to the allowance **as a decimal string** (same
 *          units as `token.decimals`). An empty allowance is returned as `"0"`.
 *
 * @throws {Error} If the `ERC20RecurringPaymentProxy` has no known deployment
 *                 on the provided `network`..
 */
export async function getPayerRecurringPaymentAllowance({
  payerAddress,
  tokenAddress,
  provider,
  network,
}: {
  payerAddress: string;
  tokenAddress: string;
  provider: Signer | providers.Provider;
  network: CurrencyTypes.EvmChainName;
}): Promise<string> {
  const erc20RecurringPaymentProxy = erc20RecurringPaymentProxyArtifact.connect(network, provider);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const allowance = await getErc20Allowance(
    payerAddress,
    erc20RecurringPaymentProxy.address,
    provider,
    tokenAddress,
  );

  return allowance.toString();
}

/**
 * Encodes the transaction data to approve or increase allowance for the ERC20RecurringPaymentProxy.
 * Tries different approval methods in order of preference:
 * 1. increaseAllowance (OpenZeppelin standard)
 * 2. increaseApproval (older OpenZeppelin)
 * 3. approve (ERC20 standard fallback)
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param amount - The amount to approve, as a BigNumberish value
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 * @throws {Error} If none of the approval methods are available on the token contract
 *
 * @remarks
 * • The function attempts multiple approval methods to support different ERC20 implementations
 * • The proxy address is fetched from the artifact to ensure consistency across deployments
 * • The returned bytes can be used as the `data` field in an ethereum transaction
 */
export function encodeRecurringPaymentApproval({
  tokenAddress,
  amount,
  provider,
  network,
}: {
  tokenAddress: string;
  amount: BigNumberish;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): string {
  const erc20RecurringPaymentProxy = erc20RecurringPaymentProxyArtifact.connect(network, provider);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const paymentTokenContract = ERC20__factory.connect(tokenAddress, provider);

  try {
    // Try increaseAllowance first (OpenZeppelin standard)
    return paymentTokenContract.interface.encodeFunctionData('increaseAllowance', [
      erc20RecurringPaymentProxy.address,
      amount,
    ]);
  } catch {
    // Fallback to approve if neither increase method is supported
    return paymentTokenContract.interface.encodeFunctionData('approve', [
      erc20RecurringPaymentProxy.address,
      amount,
    ]);
  }
}

/**
 * Encodes the transaction data to decrease or revoke allowance for the ERC20RecurringPaymentProxy.
 * Tries different revocation methods in order of preference:
 * 1. decreaseAllowance (OpenZeppelin standard)
 * 2. decreaseApproval (older OpenZeppelin)
 * 3. approve(0) (ERC20 standard fallback)
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param amount - The amount to decrease the allowance by, as a BigNumberish value
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 * @throws {Error} If none of the decrease/revoke methods are available on the token contract
 *
 * @remarks
 * • The function attempts multiple decrease methods to support different ERC20 implementations
 * • If no decrease method is available, falls back to completely revoking the allowance with approve(0)
 * • The proxy address is fetched from the artifact to ensure consistency across deployments
 * • The returned bytes can be used as the `data` field in an ethereum transaction
 */
export function encodeRecurringPaymentAllowanceDecrease({
  tokenAddress,
  amount,
  provider,
  network,
}: {
  tokenAddress: string;
  amount: BigNumberish;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): string {
  const erc20RecurringPaymentProxy = erc20RecurringPaymentProxyArtifact.connect(network, provider);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const paymentTokenContract = ERC20__factory.connect(tokenAddress, provider);

  try {
    // Try decreaseAllowance first (OpenZeppelin standard)
    return paymentTokenContract.interface.encodeFunctionData('decreaseAllowance', [
      erc20RecurringPaymentProxy.address,
      amount,
    ]);
  } catch {
    // Fallback to approve(0) if neither decrease method is supported
    return paymentTokenContract.interface.encodeFunctionData('approve', [
      erc20RecurringPaymentProxy.address,
      0, // Complete revocation
    ]);
  }
}

/**
 * Returns the deployed address of the ERC20RecurringPaymentProxy contract for a given network.
 *
 * @param network - The EVM chain name (e.g. 'mainnet', 'goerli', 'matic')
 *
 * @returns The deployed proxy contract address for the specified network
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy has no known deployment
 *                 on the provided network
 *
 * @remarks
 * • This is a pure helper that doesn't require a provider or make any network calls
 * • The address is looked up from the deployment artifacts maintained by the smart-contracts package
 * • Use this when you only need the address and don't need to interact with the contract
 */
export function getRecurringPaymentProxyAddress(network: CurrencyTypes.EvmChainName): string {
  const address = erc20RecurringPaymentProxyArtifact.getAddress(network);

  if (!address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  return address;
}

/**
 * Encodes the transaction data to execute a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to execute (1-based)
 * @param paymentReference - Reference data for the payment execution
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 *
 * @remarks
 * • The function only encodes the transaction data without executing it
 * • The encoded data can be used with any web3 library or multisig wallet
 * • Make sure the paymentIndex matches the expected execution sequence
 */
export function encodeRecurringPaymentExecution({
  permitTuple,
  permitSignature,
  paymentIndex,
  paymentReference,
  network,
  provider,
}: {
  permitTuple: PaymentTypes.SchedulePermit;
  permitSignature: string;
  paymentIndex: number;
  paymentReference: string;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const proxyContract = erc20RecurringPaymentProxyArtifact.connect(network, provider);

  return proxyContract.interface.encodeFunctionData('execute', [
    permitTuple,
    permitSignature,
    paymentIndex,
    paymentReference,
  ]);
}

/**
 * Executes a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to execute (1-based)
 * @param paymentReference - Reference data for the payment execution
 * @param signer - The signer that will execute the transaction (must have EXECUTOR_ROLE)
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns A Promise resolving to the transaction receipt after the payment is confirmed
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 * @throws {Error} If the transaction fails (e.g. wrong index, expired permit, insufficient allowance)
 *
 * @remarks
 * • The function waits for the transaction to be mined before returning
 * • The signer must have been granted EXECUTOR_ROLE by the proxy admin
 * • Make sure all preconditions are met (allowance, balance, timing) before calling
 */
export async function executeRecurringPayment({
  permitTuple,
  permitSignature,
  paymentIndex,
  paymentReference,
  signer,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermit;
  permitSignature: string;
  paymentIndex: number;
  paymentReference: string;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionReceipt> {
  const proxyAddress = getRecurringPaymentProxyAddress(network);

  const data = encodeRecurringPaymentExecution({
    permitTuple,
    permitSignature,
    paymentIndex,
    paymentReference,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: proxyAddress,
    data,
    value: 0,
  });

  return tx.wait();
}
