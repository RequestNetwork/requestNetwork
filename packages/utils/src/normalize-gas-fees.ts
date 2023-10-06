import { BigNumber, constants } from 'ethers';

import { maxBigNumber } from './index';
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
  suggestFees,
}: {
  logger: LogTypes.ILogger;
  gasPriceMin?: BigNumber;
  suggestFees: () => Promise<FeeTypes.SuggestedFees>;
}): Promise<FeeTypes.EstimatedGasFees> {
  try {
    const suggestedFee = await suggestFees();

    const baseFee = maxBigNumber(suggestedFee.baseFee, gasPriceMin || constants.Zero);

    const maxPriorityFeePerGas = maxBigNumber(
      suggestedFee.maxPriorityFee,
      gasPriceMin || constants.Zero,
    );
    const maxFeePerGas = baseFee.add(maxPriorityFeePerGas);

    if (maxPriorityFeePerGas.eq(0) || maxFeePerGas.eq(0)) {
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
