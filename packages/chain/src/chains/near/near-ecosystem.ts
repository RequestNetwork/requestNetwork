import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains } from './index';
import { NearChain } from './near-chain';

class NearEcosystem extends EcosystemAbstract<ChainTypes.ECOSYSTEM.NEAR> {
  constructor(chains: Record<string, NearChain>) {
    super(ChainTypes.ECOSYSTEM.NEAR, NearChain, chains, [
      RequestLogicTypes.CURRENCY.ETH,
      RequestLogicTypes.CURRENCY.ERC20,
    ]);
  }
}

export default new NearEcosystem(chains);
