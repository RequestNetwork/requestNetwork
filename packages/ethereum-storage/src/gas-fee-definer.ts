import { BigNumber, providers, constants } from 'ethers';
import { GasDefinerProps } from './ethereum-storage-ethers';
import { estimateGasFees } from '@requestnetwork/utils';
import { LogTypes } from '@requestnetwork/types';

export class GasFeeDefiner {
  private readonly logger: LogTypes.ILogger;
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasPriceMin: BigNumber;

  constructor({
    logger,
    provider,
    gasPriceMin,
  }: GasDefinerProps & { logger?: LogTypes.ILogger; provider: providers.JsonRpcProvider }) {
    this.logger = logger || console;
    this.provider = provider;
    this.gasPriceMin = gasPriceMin || constants.Zero;
  }

  public async getGasFees(): Promise<{
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  }> {
    return estimateGasFees({
      logger: this.logger,
      provider: this.provider,
      gasPriceMin: this.gasPriceMin,
    });
  }
}
