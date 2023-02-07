import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { Chain } from '../../types';
import {
  addNativeCurrenciesToChains,
  genericAssertChainSupported,
  genericGetChainId,
  genericGetChainName,
} from '../utils';

import * as NearDefinition from './near';
import * as NearTestnetDefinition from './near-testnet';

type NearChain = Chain;

export const chains: Record<CurrencyTypes.NearChainName, NearChain> = {
  aurora: NearDefinition, // FIXME: aurora should be removed from near chains (it is a mistake)
  'aurora-testnet': NearTestnetDefinition, // FIXME: aurora should be removed from near chains (it is a mistake)
  near: NearDefinition,
  'near-testnet': NearTestnetDefinition,
};

export const chainNames = Object.keys(chains) as CurrencyTypes.NearChainName[];

// add native currencies
addNativeCurrenciesToChains(chains, RequestLogicTypes.CURRENCY.ETH);

/**
 * Asserts if a specific chain is supported across NEAR-type supported chains
 */
export const assertChainSupported =
  genericAssertChainSupported<CurrencyTypes.NearChainName>(chainNames);

/**
 * Get the NEAR chain ID from the chain name
 */
export const getChainId = genericGetChainId<CurrencyTypes.NearChainName, NearChain, string>(chains);

/**
 * Get the NEAR chain name from its ID
 */
export const getChainName = genericGetChainName<CurrencyTypes.NearChainName, NearChain, string>(
  chains,
  chainNames,
);
