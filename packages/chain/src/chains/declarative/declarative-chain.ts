import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ChainAbstract } from '../chain-abstract';

export class DeclarativeChain extends ChainAbstract implements ChainTypes.IDeclarativeChain {
  public readonly ecosystem = 'declarative';
  public readonly currencyType = RequestLogicTypes.CURRENCY.ETH;
}
