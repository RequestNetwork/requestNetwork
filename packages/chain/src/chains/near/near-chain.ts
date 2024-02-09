import { ChainAbstract } from '../chain-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

export class NearChain extends ChainAbstract implements ChainTypes.INearChain {
  public readonly ecosystem = 'near';
  public readonly currencyType = RequestLogicTypes.CURRENCY.ETH;
}
