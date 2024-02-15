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
  currencyType: RequestLogicTypes.CURRENCY;
  eq(chain: IChainCommon): boolean;
}

export interface IBtcChain extends IChainCommon {
  ecosystem: ECOSYSTEM.BTC;
  currencyType: RequestLogicTypes.CURRENCY.BTC;
}

export interface IDeclarativeChain extends IChainCommon {
  ecosystem: ECOSYSTEM.DECLARATIVE;
  currencyType: RequestLogicTypes.CURRENCY.ETH;
}

export interface IEvmChain extends IChainCommon {
  ecosystem: ECOSYSTEM.EVM;
  currencyType: RequestLogicTypes.CURRENCY.ETH;
}

export interface INearChain extends IChainCommon {
  ecosystem: ECOSYSTEM.NEAR;
  currencyType: RequestLogicTypes.CURRENCY.ETH;
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

// export interface IChainManager {
//   chains: IChain[];
//
//   /**
//    * Gets the name of a chain
//    */
//   getName(chain: string | IChain): string;
//
//   /**
//    * Gets a supported chain from its name
//    */
//   fromName<T extends ChainEcosystem[]>(
//     chainName: string,
//     ecosystemsFilter?: T,
//   ): ChainTypeByEcosystem[T[number]];
//
//   /**
//    * Gets a supported chain from its ID
//    */
//   fromId<T extends ChainEcosystem[]>(
//     chainId: string,
//     ecosystemsFilter?: T,
//   ): ChainTypeByEcosystem[T[number]];
//
//   /**
//    * Get default chain manager
//    */
//   getDefault(): IChainManager;
//
//   /**
//    * Returns true if both chains are equal or aliases.
//    * The third argument "chainsEcosystem" is only needed when comparing chains as strings.
//    */
//   isSameChain(
//     chain1: string | IChain,
//     chain2: string | IChain,
//     chainsEcosystem?: ChainEcosystem[],
//   ): boolean;
// }
