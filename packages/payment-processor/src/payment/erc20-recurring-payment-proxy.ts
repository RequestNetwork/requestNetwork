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
 * Encodes the transaction data to set the allowance for the ERC20RecurringPaymentProxy.
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param amount - The amount to approve, as a BigNumberish value
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns Array of transaction objects ready to be sent to the blockchain
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 */
export function encodeSetRecurringAllowance({
  tokenAddress,
  amount,
  provider,
  network,
}: {
  tokenAddress: string;
  amount: BigNumberish;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Array<{ to: string; data: string; value: number }> {
  const erc20RecurringPaymentProxy = erc20RecurringPaymentProxyArtifact.connect(network, provider);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const paymentTokenContract = ERC20__factory.connect(tokenAddress, provider);

  const setData = paymentTokenContract.interface.encodeFunctionData('approve', [
    erc20RecurringPaymentProxy.address,
    amount,
  ]);

  return [{ to: tokenAddress, data: setData, value: 0 }];
}

/**
 * Encodes the transaction data to trigger a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to trigger (1-based)
 * @param paymentReference - Reference data for the payment
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 *
 * @remarks
 * • The function only encodes the transaction data without sending it
 * • The encoded data can be used with any web3 library or multisig wallet
 * • Make sure the paymentIndex matches the expected payment sequence
 */
export function encodeRecurringPaymentTrigger({
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

  return proxyContract.interface.encodeFunctionData('triggerRecurringPayment', [
    permitTuple,
    permitSignature,
    paymentIndex,
    paymentReference,
  ]);
}

/**
 * Triggers a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to trigger (1-based)
 * @param paymentReference - Reference data for the payment
 * @param signer - The signer that will trigger the transaction (must have RELAYER_ROLE)
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns A Promise resolving to the transaction response (TransactionResponse)
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 * @throws {Error} If the transaction fails (e.g. wrong index, expired permit, insufficient allowance)
 *
 * @remarks
 * • The function returns the transaction response immediately after sending
 * • The signer must have been granted RELAYER_ROLE by the proxy admin
 * • Make sure all preconditions are met (allowance, balance, timing) before calling
 * • To wait for confirmation, call tx.wait() on the returned TransactionResponse
 */
export async function triggerRecurringPayment({
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
}): Promise<providers.TransactionResponse> {
  const proxyAddress = getRecurringPaymentProxyAddress(network);

  const data = encodeRecurringPaymentTrigger({
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

  return tx;
}

/**
 * Returns the deployed address of the ERC20RecurringPaymentProxy contract for a given network.
 *
 * @param network - The EVM chain name (e.g. 'mainnet', 'sepolia', 'matic')
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
