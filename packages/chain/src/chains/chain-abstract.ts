import { ChainTypes } from '@requestnetwork/types';
import { RequestLogicTypes } from '@requestnetwork/types/src';

export abstract class ChainAbstract implements ChainTypes.IChainCommon {
  public declare readonly ecosystem: ChainTypes.ECOSYSTEM;
  public declare readonly currencyType: RequestLogicTypes.CURRENCY;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly testnet: boolean = false,
  ) {}

  public eq(chain: ChainTypes.IChain): boolean {
    return this === chain || (this.ecosystem === chain.ecosystem && this.id === chain.id);
  }
}
