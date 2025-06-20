import { CurrencyTypes } from '@requestnetwork/types';
import { providers, Signer, BigNumberish } from 'ethers';
import {
  erc20RecurringPaymentProxyArtifact,
  ERC20__factory,
} from '@requestnetwork/smart-contracts';
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
    try {
      // Try increaseApproval if increaseAllowance is not supported
      return paymentTokenContract.interface.encodeFunctionData('increaseApproval', [
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
}
