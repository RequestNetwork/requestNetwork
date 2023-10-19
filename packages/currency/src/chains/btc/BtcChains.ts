import { ChainsAbstract } from '../ChainsAbstract';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BtcChain, chains } from './index.js';

class BtcChains extends ChainsAbstract<CurrencyTypes.BtcChainName, BtcChain, string> {}
export default new BtcChains(chains, RequestLogicTypes.CURRENCY.BTC);
