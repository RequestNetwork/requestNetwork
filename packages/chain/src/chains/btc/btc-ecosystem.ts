import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains } from './index';
import { BtcChain } from './btc-chain';

class BtcEcosystem extends EcosystemAbstract<ChainTypes.ECOSYSTEM.BTC> {}
export default new BtcEcosystem(
  ChainTypes.ECOSYSTEM.BTC,
  BtcChain,
  chains,
  RequestLogicTypes.CURRENCY.BTC,
);
