import { ChainAbstract } from '../chain-abstract';
import { ChainTypes } from '@requestnetwork/types';

export class NearChain extends ChainAbstract implements ChainTypes.INearChain {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.NEAR;
}
