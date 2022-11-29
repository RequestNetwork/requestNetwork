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

    let baseFee: BigNumber | undefined;
    let maxPriorityFeePerGas: BigNumber | undefined;
    let maxFeePerGas: BigNumber | undefined;

    baseFee = BigNumber.from(suggestedFee.baseFeeSuggestion);
    if (this.gasPriceMin && baseFee.lt(this.gasPriceMin)) {
      baseFee = this.gasPriceMin;
    }

    maxPriorityFeePerGas = BigNumber.from(suggestedFee.maxPriorityFeeSuggestions.urgent);
    maxFeePerGas = baseFee.add(maxPriorityFeePerGas);

    maxPriorityFeePerGas = maxPriorityFeePerGas.gt(0) ? maxPriorityFeePerGas : undefined;
    maxFeePerGas = maxFeePerGas.gt(0) ? maxFeePerGas : undefined;

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }
}
