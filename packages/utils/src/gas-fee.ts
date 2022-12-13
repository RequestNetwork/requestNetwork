import { BigNumber, constants, providers } from 'ethers';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import Utils from './';

/**
 * The function calculates gas fee information relative to EIP-1559.
 * @param provider Generic provider.
 * @param fallbackToGasPrice A boolean allowing if true to return gasPrice in case maxFeePerGas and maxPriorityFeePerGas equals 0.
 * @param gasPriceMin Minimum gas price to return.
 * @returns an object containing:
 * - maxFeePerGas: The maximum fee per unit of gas for this transaction.
 *   maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
 *   The baseFeePerGas depends on how full the previous blocks were.
 * - maxPriorityFeePerGas: The maximum priority fee per unit of gas for this transaction.
 * - gasPrice: Optional fallback: the gas price for this transaction.
 */
export const calculateGasFees = async (
  provider: providers.JsonRpcProvider,
  fallbackToGasPrice = false,
  gasPriceMin?: BigNumber,
): Promise<{
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
  gasPrice?: BigNumber;
}> => {
  const suggestedFee = await suggestFees(provider);

  const baseFee = Utils.max(suggestedFee.baseFeeSuggestion, gasPriceMin || constants.Zero);

  const maxPriorityFeePerGas = Utils.max(
    suggestedFee.maxPriorityFeeSuggestions.urgent,
    gasPriceMin || constants.Zero,
  );
  const maxFeePerGas = baseFee.add(maxPriorityFeePerGas);

  if (maxPriorityFeePerGas.eq(0) || maxFeePerGas.eq(0)) {
    if (fallbackToGasPrice) {
      console.debug('Fallback to gasPrice');
      return { gasPrice: await provider.getGasPrice() };
    }
    return {};
  }

  return {
    maxPriorityFeePerGas,
    maxFeePerGas,
  };
};
