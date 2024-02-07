import { ChainAbstract } from '../chain-abstract';
import { RequestLogicTypes } from '@requestnetwork/types';

export class BtcChain extends ChainAbstract {
  public readonly ecosystem = 'btc';
  public readonly currenciesType = RequestLogicTypes.CURRENCY.BTC;
}
