import BtcChains from './btc/BtcChains';
import EvmChains from './evm/EvmChains';
import NearChains from './near/NearChains';

// Returns true if both chains are equal or aliases
export const isSameChain = (chain1: string, chain2: string): boolean => {
  return (
    chain1 === chain2 ||
    !![EvmChains, NearChains, BtcChains].find((chainSystem) => {
      return chainSystem.isSameChainFromString(chain1, chain2);
    })
  );
};
