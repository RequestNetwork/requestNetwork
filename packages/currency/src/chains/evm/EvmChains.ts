import { ChainsAbstract } from '../ChainsAbstract.js';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { chains, EvmChain } from './index.js';

class EvmChains extends ChainsAbstract<CurrencyTypes.EvmChainName, EvmChain, number> {}
export default new EvmChains(chains, RequestLogicTypes.CURRENCY.ETH);
