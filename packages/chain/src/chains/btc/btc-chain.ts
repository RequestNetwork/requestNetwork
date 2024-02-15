import { ChainAbstract } from '../chain-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

export class BtcChain extends ChainAbstract {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.BTC;
  public readonly currencyType = RequestLogicTypes.CURRENCY.BTC;
}
