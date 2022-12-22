import { BigNumber, constants, providers } from 'ethers';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import { max } from './index';

/**
 * The function estimates gas fee with EIP-1559.
 * @param provider Generic provider.
 * @param gasPriceMin Minimum gas price to return.
 * @returns an object containing:
 * - maxFeePerGas: The maximum fee per unit of gas for this transaction.
 *   maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
 *   The baseFeePerGas depends on how full the previous blocks were.
 * - maxPriorityFeePerGas: The maximum priority fee per unit of gas for this transaction.
 * - gasPrice: Optional fallback: the gas price for this transaction.
 */
async function estimateGasFees({
  provider,
  gasPriceMin,
}: {
  provider: providers.Provider | providers.JsonRpcProvider;
  gasPriceMin?: BigNumber;
}): Promise<{
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
}> {
  const suggestedFee = await suggestFees(provider as providers.JsonRpcProvider);

  const baseFee = max(suggestedFee.baseFeeSuggestion, gasPriceMin || constants.Zero);

  const maxPriorityFeePerGas = max(
    suggestedFee.maxPriorityFeeSuggestions.urgent,
    gasPriceMin || constants.Zero,
  );
  const maxFeePerGas = baseFee.add(maxPriorityFeePerGas);

  if (maxPriorityFeePerGas.eq(0) || maxFeePerGas.eq(0)) {
    return {};
  }

  return {
    maxPriorityFeePerGas,
    maxFeePerGas,
  };
}

export  { estimateGasFees };
