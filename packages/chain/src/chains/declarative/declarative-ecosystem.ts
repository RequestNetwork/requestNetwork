import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { DeclarativeChain } from './declarative-chain';
import { chains } from './index';

class DeclarativeEcosystem extends EcosystemAbstract<ChainTypes.ECOSYSTEM.DECLARATIVE> {
  constructor(chains: Record<string, DeclarativeChain>) {
    super(ChainTypes.ECOSYSTEM.DECLARATIVE, DeclarativeChain, chains, [
      RequestLogicTypes.CURRENCY.ISO4217,
      RequestLogicTypes.CURRENCY.BTC,
      RequestLogicTypes.CURRENCY.ETH,
      RequestLogicTypes.CURRENCY.ERC20,
      RequestLogicTypes.CURRENCY.ERC777,
    ]);
  }
}

export default new DeclarativeEcosystem(chains);
