import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { DeclarativeChain } from './declarative-chain';
import { chains } from './index';

class DeclarativeEcosystem extends EcosystemAbstract<ChainTypes.IDeclarativeChain> {
  constructor(chains: Record<string, DeclarativeChain>) {
    super('declarative', DeclarativeChain, chains, RequestLogicTypes.CURRENCY.ETH);
  }
}

export default new DeclarativeEcosystem(chains);
