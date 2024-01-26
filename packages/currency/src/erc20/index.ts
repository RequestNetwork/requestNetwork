import { ERC20Currency, TokenMap } from '../types';
import { supportedNetworks } from './chains';
import { CurrencyTypes } from '@requestnetwork/types';

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Tokens(): ERC20Currency[] {
  return (Object.entries(supportedNetworks) as [CurrencyTypes.EvmChainName, TokenMap][]).reduce(
    (acc: ERC20Currency[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(([address, token]) => ({
          address,
          network: networkName,
          decimals: token.decimals,
          symbol: token.symbol,
          id: token.id || `${token.symbol}-${networkName}`,
        })),
      ];
    },
    [],
  );
}
