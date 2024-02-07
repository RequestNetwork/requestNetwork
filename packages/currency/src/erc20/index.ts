import { ERC20CurrencyInput, TokenMap } from '../types';
import { supportedNetworks } from './chains';
import { RequestLogicTypes } from '@requestnetwork/types';

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Currencies(): ERC20CurrencyInput[] {
  return (Object.entries(supportedNetworks) as [string, TokenMap][]).reduce(
    (acc: ERC20CurrencyInput[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(
          ([address, token]) =>
            ({
              type: RequestLogicTypes.CURRENCY.ERC20,
              address,
              network: networkName,
              decimals: token.decimals,
              symbol: token.symbol,
              id: token.id,
            }) as const,
        ),
      ];
    },
    [],
  );
}
