import { supportedNetworks } from './chains';
import { CurrencyTypes } from '@requestnetwork/types';

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Tokens(): CurrencyTypes.ERC20Currency[] {
  return (
    Object.entries(supportedNetworks) as [CurrencyTypes.EvmChainName, CurrencyTypes.TokenMap][]
  ).reduce((acc: CurrencyTypes.ERC20Currency[], [networkName, supportedCurrencies]) => {
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
