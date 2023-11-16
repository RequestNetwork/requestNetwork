import { supportedNetworks } from './chains';
import { CurrencyTypes } from '@requestnetwork/types';

/**
 * Returns a list of supported ERC777 tokens
 *
 * @returns List of supported ERC777 tokens
 */
export function getSupportedERC777Tokens(): CurrencyTypes.ERC777Currency[] {
  return (
    Object.entries(supportedNetworks) as [CurrencyTypes.EvmChainName, CurrencyTypes.TokenMap][]
  ).reduce((acc: CurrencyTypes.ERC777Currency[], [networkName, supportedCurrencies]) => {
    return [
      ...acc,
      ...Object.entries(supportedCurrencies).map(([address, token]) => ({
        address,
        network: networkName,
        decimals: token.decimals,
        symbol: token.symbol,
      })),
    ];
  }, []);
}
