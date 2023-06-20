import { maxBigNumber, minBigNumber } from './index';
import { LogTypes, FeeTypes } from '@requestnetwork/types';

/**
 * The function estimates gas fee with EIP-1559.
 * @returns an object containing:
 * - maxFeePerGas: The maximum fee per unit of gas for this transaction.
 *   maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
 *   The baseFeePerGas depends on how full the previous blocks were.
 * - maxPriorityFeePerGas: The maximum priority fee per unit of gas for this transaction.
 */
async function normalizeGasFees({
  logger,
  gasPriceMin,
  gasPriceMax,
  gasPriceMultiplier,
  suggestFees,
}: {
  logger: LogTypes.ILogger;
  gasPriceMin?: bigint;
  gasPriceMax?: bigint;
  gasPriceMultiplier?: number;
  suggestFees: () => Promise<FeeTypes.SuggestedFees>;
}): Promise<FeeTypes.EstimatedGasFees> {
  try {
    const suggestedFee = await suggestFees();
    const baseFee = maxBigNumber(suggestedFee.baseFee, gasPriceMin || 0n);
    const maxPriorityFeePerGas = maxBigNumber(suggestedFee.maxPriorityFee, gasPriceMin || 0n);

    const maxFeePerGasInit =
      ((baseFee + maxPriorityFeePerGas) * BigInt(gasPriceMultiplier || 100)) / 100n;
    const maxFeePerGas = gasPriceMax
      ? minBigNumber(maxFeePerGasInit, gasPriceMax)
      : maxFeePerGasInit;

    if (maxPriorityFeePerGas === 0n || maxFeePerGas === 0n) {
      logger.warn(
        `normalizeGasFees: maxPriorityFeePerGas or maxFeePerGas too low (maxPriorityFeePerGas: ${maxPriorityFeePerGas.toString()} / maxFeePerGas: ${maxFeePerGas.toString()})`,
      );
      return {};
    }

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  } catch (e) {
    logger.error(`normalizeGasFees error: ${e}`);
    return {};
  }
}

export { normalizeGasFees };
