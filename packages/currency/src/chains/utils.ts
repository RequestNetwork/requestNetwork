import { nativeCurrencies } from '../native';
import { ChainDefinition, NamedNativeCurrency, TokenMap } from '../types';
import { RequestLogicTypes } from '@requestnetwork/types';

export function genericAssertChainSupported<T extends string>(
  chainKey: string,
  supportedChains: T[],
): asserts chainKey is T {
  if (!(supportedChains as string[]).includes(chainKey))
    throw new Error(`Unsupported chain ${chainKey}`);
}

export const addNativeCurrenciesToChains = (
  chains: Record<string, ChainDefinition>,
  currencyType: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC,
): void => {
  const chainNames = Object.keys(chains);
  chainNames.forEach((chainName) => {
    const nativeCurrency = (nativeCurrencies[currencyType] as NamedNativeCurrency[]).find(
      (currency) => currency.network === chainName,
    );
    if (nativeCurrency) {
      const chainCurrencies: TokenMap = chains[chainName].currencies || {};
      chainCurrencies.native = nativeCurrency;
      chains[chainName].currencies = chainCurrencies;
    }
  });
};
