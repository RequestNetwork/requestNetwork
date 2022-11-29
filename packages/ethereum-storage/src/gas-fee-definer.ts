import { BigNumber, providers } from 'ethers';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import { GasDefinerProps } from './ethereum-storage-ethers';

export class GasFeeDefiner {
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasPriceMin: BigNumber | undefined;

  constructor({
    provider,
    gasPriceMin,
  }: GasDefinerProps & { provider: providers.JsonRpcProvider }) {
    this.provider = provider;
    this.gasPriceMin = gasPriceMin;
  }

  public async getGasFees(): Promise<{
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  }> {
    const suggestedFee = await suggestFees(this.provider);

    let maxPriorityFeePerGas: BigNumber | undefined;
    let maxFeePerGas: BigNumber | undefined;

    maxPriorityFeePerGas = BigNumber.from(suggestedFee.maxPriorityFeeSuggestions.urgent);
    maxFeePerGas = maxPriorityFeePerGas.add(suggestedFee.baseFeeSuggestion);

    maxPriorityFeePerGas = maxPriorityFeePerGas.gt(0) ? maxPriorityFeePerGas : undefined;
    maxFeePerGas = maxFeePerGas.gt(0) ? maxFeePerGas : undefined;

    if (this.gasPriceMin && maxFeePerGas && maxFeePerGas.lt(this.gasPriceMin)) {
      maxFeePerGas = BigNumber.from(this.gasPriceMin);
    }

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }
}
