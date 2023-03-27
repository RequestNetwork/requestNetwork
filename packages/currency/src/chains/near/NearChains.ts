import { ChainsAbstract } from '../ChainsAbstract';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { NearChain, chains } from './index';

class NearChains extends ChainsAbstract<CurrencyTypes.NearChainName, NearChain, string> {}
export default new NearChains(chains, RequestLogicTypes.CURRENCY.ETH);
