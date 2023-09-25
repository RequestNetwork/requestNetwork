import { BigNumber, constants, providers } from 'ethers';
import { suggestFees } from '@rainbow-me/fee-suggestions';
import { maxBigNumber } from './index';
import { LogTypes } from '@requestnetwork/types';

/**
 * The function estimates gas fee with EIP-1559.
 * @param provider Generic provider.
 * @param gasPriceMin Minimum gas price to return.
 * @returns an object containing:
 * - maxFeePerGas: The maximum fee per unit of gas for this transaction.
 *   maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
 *   The baseFeePerGas depends on how full the previous blocks were.
 * - maxPriorityFeePerGas: The maximum priority fee per unit of gas for this transaction.
 */
async function estimateGasFees({
  logger,
  provider,
  gasPriceMin,
}: {
  logger: LogTypes.ILogger;
  provider: providers.Provider | providers.JsonRpcProvider;
  gasPriceMin?: BigNumber;
}): Promise<{
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
}> {
  try {
    const suggestedFee = await suggestFees(provider as providers.JsonRpcProvider);

    const baseFee = maxBigNumber(suggestedFee.baseFeeSuggestion, gasPriceMin || constants.Zero);

    const maxPriorityFeePerGas = maxBigNumber(
      suggestedFee.maxPriorityFeeSuggestions.urgent,
      gasPriceMin || constants.Zero,
    );
    const maxFeePerGas = baseFee.add(maxPriorityFeePerGas);

    if (maxPriorityFeePerGas.eq(0) || maxFeePerGas.eq(0)) {
      logger.warn(
        `estimateGasFees: maxPriorityFeePerGas or maxFeePerGas too low (maxPriorityFeePerGas: ${maxPriorityFeePerGas.toString()} / maxFeePerGas: ${maxFeePerGas.toString()})`,
      );
      return {};
    }

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  } catch (e) {
    logger.error(`estimateGasFees error: ${e}`);
    return {};
  }
}

export { estimateGasFees };
