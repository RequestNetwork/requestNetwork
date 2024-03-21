import { ChainTypes } from '@requestnetwork/types';

export abstract class ChainAbstract implements ChainTypes.IChainCommon {
  public declare readonly ecosystem: ChainTypes.ECOSYSTEM;
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly testnet: boolean = false,
  ) {
    this.name = this.name.toLowerCase();
  }
  public eq(chain: ChainTypes.IChain): boolean {
    return this === chain || (this.ecosystem === chain.ecosystem && this.id === chain.id);
  }
}
