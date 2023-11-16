import { supportedRinkebyERC777 } from './rinkeby';
import { CurrencyTypes } from '@requestnetwork/types';

export const supportedNetworks: Partial<
  Record<CurrencyTypes.EvmChainName, CurrencyTypes.TokenMap>
> = {
  rinkeby: supportedRinkebyERC777,
};
