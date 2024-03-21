import { ChainAbstract } from '../chain-abstract';
import { ChainTypes } from '@requestnetwork/types';

export class EvmChain extends ChainAbstract implements ChainTypes.IEvmChain {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.EVM;
}
