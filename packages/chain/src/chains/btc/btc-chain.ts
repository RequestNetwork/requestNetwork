import { ChainAbstract } from '../chain-abstract';
import { ChainTypes } from '@requestnetwork/types';

export class BtcChain extends ChainAbstract implements ChainTypes.IBtcChain {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.BTC;
}
