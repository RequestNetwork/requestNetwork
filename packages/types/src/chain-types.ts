import { RequestLogicTypes } from './index';

export interface IChainCommon {
  id: string;
  name: string;
  testnet: boolean;
  ecosystem: ChainEcosystem;
  currencyType: RequestLogicTypes.CURRENCY;
  eq(chain: IChainCommon): boolean;
}

export interface IBtcChain extends IChainCommon {
  ecosystem: 'btc';
  currencyType: RequestLogicTypes.CURRENCY.BTC;
}

export interface IDeclarativeChain extends IChainCommon {
  ecosystem: 'declarative';
  currencyType: RequestLogicTypes.CURRENCY.ETH;
}

export interface IEvmChain extends IChainCommon {
  ecosystem: 'evm';
  currencyType: RequestLogicTypes.CURRENCY.ETH;
}

export interface INearChain extends IChainCommon {
  ecosystem: 'near';
  currencyType: RequestLogicTypes.CURRENCY.ETH;
}

/**
 * List of ecosystems supported by the Request Network protocol
 */
export type ChainTypeByEcosystem = {
  btc: IBtcChain;
  declarative: IDeclarativeChain;
  evm: IEvmChain;
  near: INearChain;
};
export type ChainEcosystem = keyof ChainTypeByEcosystem;
export type IChain = ChainTypeByEcosystem[ChainEcosystem];

/**
 * VmChains are Virtual Machine chains supported by TheGraph
 */
export type IVmChain = IEvmChain | INearChain;

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
