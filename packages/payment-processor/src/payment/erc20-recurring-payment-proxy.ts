import { CurrencyTypes } from '@requestnetwork/types';
import { providers, Signer } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
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
