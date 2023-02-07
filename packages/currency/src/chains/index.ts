import { CurrencyTypes } from '@requestnetwork/types';
import * as BTC from './btc';
import * as EVM from './evm';
import * as NEAR from './near';

/**
 * Asserts if a specific chain is supported across all supported chain types (BTC + EVM + NEAR)
 * @param chainName
 */
export function assertChainSupported(
  chainName: string,
): asserts chainName is CurrencyTypes.EvmChainName {
  const chainSupported = [BTC, EVM, NEAR].some((chainType) => {
    try {
      chainType.assertChainSupported(chainName);
      return true;
    } catch (e) {
      return false;
    }
  });
  if (!chainSupported) {
    throw new Error(`Unsupported chain ${chainName}`);
  }
}

export { BTC, EVM, NEAR };
