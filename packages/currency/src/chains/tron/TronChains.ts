import { ChainsAbstract } from '../ChainsAbstract';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { TronChain, chains } from './index';

class TronChains extends ChainsAbstract<CurrencyTypes.TronChainName, TronChain, string> {}
export default new TronChains(chains, RequestLogicTypes.CURRENCY.ETH);
