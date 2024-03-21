import { ChainAbstract } from './chain-abstract';
import { ChainDefinition } from '../types';

export const initializeChains = <CHAIN_CLASS extends ChainAbstract>(
  chainClass: new (chainId: string, chainName: string, testnet?: boolean) => CHAIN_CLASS,
  chainDefinitions: Record<string, ChainDefinition>,
): Record<string, CHAIN_CLASS> =>
  Object.keys(chainDefinitions).reduce(
    (chains, chainName) => {
      chains[chainName] = new chainClass(
        chainDefinitions[chainName].chainId,
        chainName,
        chainDefinitions[chainName].testnet,
      );
      return chains;
    },
    {} as Record<string, CHAIN_CLASS>,
  );
