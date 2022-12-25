import { BigNumber, providers, constants } from 'ethers';
import { GasDefinerProps } from './ethereum-storage-ethers';
import { estimateGasFees } from '@requestnetwork/utils';

export class GasFeeDefiner {
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasPriceMin: BigNumber;

  constructor({
    provider,
    gasPriceMin,
  }: GasDefinerProps & { provider: providers.JsonRpcProvider }) {
    this.provider = provider;
    this.gasPriceMin = gasPriceMin || constants.Zero;
  }

  public async getGasFees(): Promise<{
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  }> {
    return estimateGasFees({ provider: this.provider, gasPriceMin: this.gasPriceMin });
  }
}
