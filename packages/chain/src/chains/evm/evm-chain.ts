import { ChainAbstract } from '../chain-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

export class EvmChain extends ChainAbstract implements ChainTypes.IEvmChain {
  public readonly ecosystem = ChainTypes.ECOSYSTEM.EVM;
  public readonly currencyType = RequestLogicTypes.CURRENCY.ETH;
}
