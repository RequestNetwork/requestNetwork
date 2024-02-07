import { ERC777Currency, ERC777CurrencyInput, TokenMap } from '../types';
import { supportedNetworks } from './chains';
import { ChainManager } from '@requestnetwork/chain';
import { RequestLogicTypes } from '@requestnetwork/types';

/**
 * Returns a list of supported ERC777 tokens
 *
 * @returns List of supported ERC777 tokens
 */
export function getSupportedERC777Currencies(): ERC777CurrencyInput[] {
  return (Object.entries(supportedNetworks) as [string, TokenMap][]).reduce(
    (acc: ERC777CurrencyInput[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(
          ([address, token]) =>
            ({
              type: RequestLogicTypes.CURRENCY.ERC777,
              address,
              network: networkName,
              decimals: token.decimals,
              symbol: token.symbol,
            }) as const,
        ),
      ];
    },
    [],
  );
}
