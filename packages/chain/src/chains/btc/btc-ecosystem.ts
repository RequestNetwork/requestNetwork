import { EcosystemAbstract } from '../ecosystem-abstract';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains } from './index';
import { BtcChain } from './btc-chain';

class BtcEcosystem extends EcosystemAbstract<ChainTypes.IBtcChain> {}
export default new BtcEcosystem('btc', BtcChain, chains, RequestLogicTypes.CURRENCY.BTC);
