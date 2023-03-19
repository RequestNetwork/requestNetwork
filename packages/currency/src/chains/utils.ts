import BtcChains from './btc/BtcChains';
import EvmChains from './evm/EvmChains';
import NearChains from './near/NearChains';

// Returns true if both network are equal or aliases
export const isSameNetwork = (network1: string, network2: string): boolean => {
  if (network1 === network2) return true;
  [EvmChains, NearChains, BtcChains].forEach((chainSystem) => {
    if (chainSystem.isNetworkAlias(network1, network2)) return true;
  });
  return false;
};
