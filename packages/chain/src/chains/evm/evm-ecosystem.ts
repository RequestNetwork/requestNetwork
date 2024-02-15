import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains } from './index';
import { EvmChain } from './evm-chain';

class EvmEcosystem extends EcosystemAbstract<ChainTypes.IEvmChain> {
  constructor(chains: Record<string, EvmChain>) {
    super(ChainTypes.ECOSYSTEM.EVM, EvmChain, chains, RequestLogicTypes.CURRENCY.ETH);
  }
}

export default new EvmEcosystem(chains);
