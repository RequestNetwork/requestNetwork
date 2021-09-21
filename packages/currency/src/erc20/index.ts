import { ERC20Currency } from '../types';
import { supportedNetworks } from './networks';

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Tokens(): ERC20Currency[] {
  return Object.entries(supportedNetworks).reduce(
    (acc: ERC20Currency[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(([address, token]) => ({
          address,
          network: networkName,
          decimals: token.decimals,
          symbol: token.symbol,
        })),
      ];
    },
    [],
  );
}
