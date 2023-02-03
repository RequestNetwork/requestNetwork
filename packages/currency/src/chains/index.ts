import { CurrencyTypes } from '@requestnetwork/types';
import * as EVM from './evm';
import * as BTC from './btc';

/**
 * Asserts if a specific chain is supported across all supported chain types (EVM + BTC)
 * @param chainName
 */
export function assertChainSupported(
  chainName: string,
): asserts chainName is CurrencyTypes.EvmChainName {
  const chainSupported = [EVM, BTC].some((chainType) => {
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

export { EVM, BTC };
