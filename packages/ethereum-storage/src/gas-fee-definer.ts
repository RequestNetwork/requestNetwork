import { suggestFees } from '@rainbow-me/fee-suggestions';
import { BigNumber, providers } from 'ethers';
import { normalizeGasFees } from '@requestnetwork/utils';
import { FeeTypes, LogTypes } from '@requestnetwork/types';

export class GasFeeDefiner {
  private readonly logger: LogTypes.ILogger;
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasPriceMin?: BigNumber;
  private readonly gasPriceMax?: BigNumber;
  private readonly gasPriceMultiplier?: number;

  constructor({
    logger,
    provider,
    gasPriceMin,
    gasPriceMax,
    gasPriceMultiplier,
  }: {
    logger: LogTypes.ILogger;
    gasPriceMin?: BigNumber;
    gasPriceMax?: BigNumber;
    gasPriceMultiplier?: number;
    provider: providers.JsonRpcProvider;
  }) {
    this.logger = logger;
    this.provider = provider;
    this.gasPriceMin = gasPriceMin;
    this.gasPriceMax = gasPriceMax;
    this.gasPriceMultiplier = gasPriceMultiplier;
  }

  public async getGasFees(): Promise<FeeTypes.EstimatedGasFees> {
    return normalizeGasFees({
      logger: this.logger,
      gasPriceMin: this.gasPriceMin,
      gasPriceMax: this.gasPriceMax,
      gasPriceMultiplier: this.gasPriceMultiplier,
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
