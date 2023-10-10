import { suggestFees } from '@rainbow-me/fee-suggestions';
import { BigNumber, providers, constants } from 'ethers';
import { normalizeGasFees } from '@requestnetwork/utils';
import { FeeTypes, LogTypes } from '@requestnetwork/types';
import { GasDefinerProps } from './ethereum-storage-ethers';

export class GasFeeDefiner {
  private readonly logger: LogTypes.ILogger;
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasPriceMin: BigNumber;

  constructor({
    logger,
    provider,
    gasPriceMin,
  }: GasDefinerProps & { logger: LogTypes.ILogger; provider: providers.JsonRpcProvider }) {
    this.logger = logger;
    this.provider = provider;
    this.gasPriceMin = gasPriceMin || constants.Zero;
  }

  public async getGasFees(): Promise<FeeTypes.EstimatedGasFees> {
    return normalizeGasFees({
      logger: this.logger,
      gasPriceMin: this.gasPriceMin,
      suggestFees: async () => {
        const { baseFeeSuggestion, maxPriorityFeeSuggestions } = await suggestFees(this.provider);
        return {
          baseFee: baseFeeSuggestion,
          maxPriorityFee: maxPriorityFeeSuggestions.urgent,
        };
      },
    });
  }
}
