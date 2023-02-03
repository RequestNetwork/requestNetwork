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

/**
 * Asserts if a specific chain is supported across BTC-type supported chains
 * @param chainName
 */
export function assertChainSupported(
  chainName: string,
): asserts chainName is CurrencyTypes.BtcChainName {
  genericAssertChainSupported<CurrencyTypes.BtcChainName>(chainName, chainNames);
}

export const getChainId = (chainName: CurrencyTypes.BtcChainName): string =>
  chains[chainName].chainId;

export const getChainName = (chainId: string): CurrencyTypes.BtcChainName | undefined =>
  chainNames.find((chainName) => chains[chainName].chainId === chainId);
