import { RequestLogicTypes } from './index';

/**
 * List of ecosystems supported by the Request Network protocol
 */
export enum ECOSYSTEM {
  BTC = 'BTC',
  DECLARATIVE = 'DECLARATIVE',
  EVM = 'EVM',
  NEAR = 'NEAR',
}

/**
 * List of ecosystems supported by TheGraph
 */
export const VM_ECOSYSTEMS = [ECOSYSTEM.EVM, ECOSYSTEM.NEAR] as const;
export type VmChainEcosystem = (typeof VM_ECOSYSTEMS)[number];

export interface IChainCommon {
  id: string;
  name: string;
  testnet: boolean;
  ecosystem: ECOSYSTEM;
  eq(chain: IChainCommon): boolean;
}

export interface IBtcChain extends IChainCommon {
  ecosystem: ECOSYSTEM.BTC;
}

export interface IDeclarativeChain extends IChainCommon {
  ecosystem: ECOSYSTEM.DECLARATIVE;
}

export interface IEvmChain extends IChainCommon {
  ecosystem: ECOSYSTEM.EVM;
}

export interface INearChain extends IChainCommon {
  ecosystem: ECOSYSTEM.NEAR;
}

/**
 * List of ecosystems supported by the Request Network protocol
 */
export type ChainTypeByEcosystem = {
  [ECOSYSTEM.BTC]: IBtcChain;
  [ECOSYSTEM.DECLARATIVE]: IDeclarativeChain;
  [ECOSYSTEM.EVM]: IEvmChain;
  [ECOSYSTEM.NEAR]: INearChain;
};
export type IChain = ChainTypeByEcosystem[ECOSYSTEM];

/**
 * VmChains are Virtual Machine chains supported by TheGraph
 */
export type IVmChain = ChainTypeByEcosystem[VmChainEcosystem];

export interface IEcosystem<E extends ECOSYSTEM> {
  name: E;
  chainClass: new (id: string, name: string, testnet?: boolean) => ChainTypeByEcosystem[E];
  chains: Record<string, ChainTypeByEcosystem[E]>;
  currencyTypes: RequestLogicTypes.CURRENCY[];
  chainNames: string[];
  assertChainNameSupported(chainName?: string): asserts chainName is string;
  assertChainSupported(chain?: IChain): asserts chain is ChainTypeByEcosystem[E];
  isChainSupported(chainName?: string | IChain): boolean;
  isSameChainFromString(chain1: string, chain2: string): boolean;
}

export interface IChainManager {
  chains: IChain[];
  ecosystems: {
    [E in ECOSYSTEM]: IEcosystem<E>;
  };
  getEcosystemsByCurrencyType(currencyType: RequestLogicTypes.CURRENCY): ECOSYSTEM[];
  fromName<T extends readonly ECOSYSTEM[]>(
    chainName: string,
    ecosystemsFilter?: T,
  ): ChainTypeByEcosystem[T[number]];
  fromId<T extends readonly ECOSYSTEM[]>(
    chainId: string,
    ecosystemsFilter?: T,
  ): ChainTypeByEcosystem[T[number]];
  isSameChain(
    chain1: string | IChain,
    chain2: string | IChain,
    chainsEcosystem?: readonly ECOSYSTEM[],
  ): boolean;
}
