import { nativeCurrencies } from '../native';
import { Chain, NamedNativeCurrency, TokenMap } from '../types';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

/**
 * Adds the native currency to the list of currencies supported by each chain
 */
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

export const genericAssertChainSupported = <CHAIN_NAME extends CurrencyTypes.ChainName>(
  chainNames: CHAIN_NAME[],
) => {
  return function (chainName: string): asserts chainName is CHAIN_NAME {
    if (!(chainNames as string[]).includes(chainName))
      throw new Error(`Unsupported chain ${chainName}`);
  };
};

export const genericGetChainId =
  <
    CHAIN_NAME extends CurrencyTypes.ChainName,
    CHAIN extends Chain,
    CHAIN_ID extends string | number,
  >(
    chains: Record<CHAIN_NAME, CHAIN>,
  ) =>
  (chainName: CHAIN_NAME): CHAIN_ID =>
    chains[chainName].chainId as CHAIN_ID;

export const genericGetChainName =
  <
    CHAIN_NAME extends CurrencyTypes.ChainName,
    CHAIN extends Chain,
    CHAIN_ID extends string | number,
  >(
    chains: Record<CHAIN_NAME, CHAIN>,
    chainNames: CHAIN_NAME[],
  ) =>
  (chainId: CHAIN_ID): CHAIN_NAME | undefined =>
    chainNames.find((chainName) => chains[chainName].chainId === chainId);
