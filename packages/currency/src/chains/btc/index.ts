import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BtcChainDefinition } from '../../types';
import { addNativeCurrenciesToChains, genericAssertChainSupported } from '../utils';

import * as MainnetDefinition from './mainnet';
import * as TestnetDefinition from './testnet';

export const chains: Record<CurrencyTypes.BtcChainName, BtcChainDefinition> = {
  mainnet: MainnetDefinition,
  testnet: TestnetDefinition,
};

export const chainNames = Object.keys(chains) as CurrencyTypes.BtcChainName[];

// add native currencies
addNativeCurrenciesToChains(chains, RequestLogicTypes.CURRENCY.BTC);

export function assertChainSupported(
  chainKey: string,
): asserts chainKey is CurrencyTypes.BtcChainName {
  genericAssertChainSupported<CurrencyTypes.BtcChainName>(chainKey, chainNames);
}

export const getChainId = (chainName: CurrencyTypes.BtcChainName): string =>
  chains[chainName].chainId;

export const getChainName = (chainId: string): CurrencyTypes.BtcChainName | undefined =>
  chainNames.find((chainName) => chains[chainName].chainId === chainId);
