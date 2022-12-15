import { BigNumber, providers, constants } from 'ethers';
import Utils from '@requestnetwork/utils';
import { GasDefinerProps } from './ethereum-storage-ethers';

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
    return Utils.estimateGasFees({ provider: this.provider, gasPriceMin: this.gasPriceMin });
  }
}
