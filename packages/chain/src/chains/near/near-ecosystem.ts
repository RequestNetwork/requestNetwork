import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains } from './index';
import { NearChain } from './near-chain';

class NearEcosystem extends EcosystemAbstract<ChainTypes.INearChain> {
  constructor(chains: Record<string, NearChain>) {
    super('near', NearChain, chains, RequestLogicTypes.CURRENCY.ETH);
  }
}

export default new NearEcosystem(chains);
