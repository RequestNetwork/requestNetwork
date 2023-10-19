import { ChainsAbstract } from '../ChainsAbstract.js';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { DeclarativeChain, chains } from './index.js';

class DeclarativeChains extends ChainsAbstract<
  CurrencyTypes.DeclarativeChainName,
  DeclarativeChain,
  string
> {}
export default new DeclarativeChains(chains, RequestLogicTypes.CURRENCY.ETH);
