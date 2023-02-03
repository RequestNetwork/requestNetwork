import { CurrencyTypes } from '@requestnetwork/types';
import * as EVM from './evm';
import * as BTC from './btc';

export function assertChainSupported(
  chainKey: string,
): asserts chainKey is CurrencyTypes.EvmChainName {
  const chainSupported = [EVM, BTC].some((chainType) => {
    try {
      chainType.assertChainSupported(chainKey);
      return true;
    } catch (e) {
      return false;
    }
  });
  if (!chainSupported) {
    throw new Error(`Unsupported chain ${chainKey}`);
  }
}

export { EVM, BTC };
