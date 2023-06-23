import { ChainsAbstract } from '../ChainsAbstract';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { DeclarativeChain, chains } from './index';

class DeclarativeChains extends ChainsAbstract<
  CurrencyTypes.DeclarativeChainName,
  DeclarativeChain,
  string
> {}
export default new DeclarativeChains(chains, RequestLogicTypes.CURRENCY.ETH);
