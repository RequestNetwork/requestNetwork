import { nativeCurrencies } from '../native';
import { Chain, NamedNativeCurrency, TokenMap } from '../types';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

export const genericAssertChainSupported = <T extends string>(chainNames: T[]) => {
  return function (chainName: string): asserts chainName is T {
    if (!(chainNames as string[]).includes(chainName))
      throw new Error(`Unsupported chain ${chainName}`);
  };
};

export const addNativeCurrenciesToChains = (
  chains: Record<string, Chain>,
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

export const genericGetChainId =
  <T extends CurrencyTypes.ChainName, D extends Chain, S extends string | number>(
    chains: Record<T, D>,
  ) =>
  (chainName: T): S =>
    chains[chainName].chainId as S;

export const genericGetChainName =
  <T extends CurrencyTypes.ChainName, D extends Chain, S extends string | number>(
    chains: Record<T, D>,
    chainNames: T[],
  ) =>
  (chainId: S): T | undefined =>
    chainNames.find((chainName) => chains[chainName].chainId === chainId);
