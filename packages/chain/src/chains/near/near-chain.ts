import { ChainAbstract } from '../chain-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

export class NearChain extends ChainAbstract implements ChainTypes.INearChain {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.NEAR;
  public readonly currencyType = RequestLogicTypes.CURRENCY.ETH;
}
