import { BigNumber, providers, constants } from 'ethers';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import { GasDefinerProps } from './ethereum-storage-ethers';
import Utils from '@requestnetwork/utils';

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
    const suggestedFee = await suggestFees(this.provider);

    const baseFee = Utils.max(suggestedFee.baseFeeSuggestion, this.gasPriceMin);

    const maxPriorityFeePerGas = Utils.max(
      suggestedFee.maxPriorityFeeSuggestions.urgent,
      this.gasPriceMin,
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
}
