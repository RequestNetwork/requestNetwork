import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BtcChainDefinition } from '../../types';
import {
  addNativeCurrenciesToChains,
  genericAssertChainSupported,
  genericGetChainId,
  genericGetChainName,
} from '../utils';

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
 */
export const assertChainSupported =
  genericAssertChainSupported<CurrencyTypes.BtcChainName>(chainNames);

/**
 * Get the BTC chain ID from the chain name
 */
export const getChainId = genericGetChainId<CurrencyTypes.BtcChainName, BtcChainDefinition, string>(
  chains,
);

/**
 * Get the BTC chain name from its ID
 */
export const getChainName = genericGetChainName<
  CurrencyTypes.BtcChainName,
  BtcChainDefinition,
  string
>(chains, chainNames);
