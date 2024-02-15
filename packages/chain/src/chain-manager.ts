import { ChainDefinition } from './types';
import { EcosystemAbstract } from './chains/ecosystem-abstract';
import BtcEcosystem from './chains/btc/btc-ecosystem';
import DeclarativeEcosystem from './chains/declarative/declarative-ecosystem';
import EvmEcosystem from './chains/evm/evm-ecosystem';
import NearEcosystem from './chains/near/near-ecosystem';
import { initializeChains } from './chains/utils';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

export class ChainManager {
  private static defaultInstance: ChainManager;

  public ecosystems: Record<ChainTypes.ECOSYSTEM, EcosystemAbstract<any>> = {
    [ChainTypes.ECOSYSTEM.BTC]: BtcEcosystem,
    [ChainTypes.ECOSYSTEM.DECLARATIVE]: DeclarativeEcosystem,
    [ChainTypes.ECOSYSTEM.EVM]: EvmEcosystem,
    [ChainTypes.ECOSYSTEM.NEAR]: NearEcosystem,
  };

  constructor(inputChains?: Record<ChainTypes.ECOSYSTEM, Record<string, ChainDefinition>>) {
    if (!inputChains) return;
    for (const ecosystemName in this.ecosystems) {
      const ecosystem = this.ecosystems[ecosystemName as ChainTypes.ECOSYSTEM];
      if (!inputChains[ecosystem.name]) continue;
      const chainDefinitions = inputChains[ecosystem.name];
      const chains = initializeChains(ecosystem.chainClass, chainDefinitions);
      Object.assign(ecosystem.chains, chains);
    }
  }

  /**
   * Returns the list of supported chains
   */
  get chains(): ChainTypes.IChain[] {
    return Object.keys(this.ecosystems).reduce((chains, ecosystemName) => {
      return chains.concat(
        Object.values(this.ecosystems[ecosystemName as ChainTypes.ECOSYSTEM].chains),
      );
    }, [] as ChainTypes.IChain[]);
  }

  getEcosystemsByCurrencyType(currencyType: RequestLogicTypes.CURRENCY): ChainTypes.ECOSYSTEM[] {
    return (Object.keys(this.ecosystems) as ChainTypes.ECOSYSTEM[]).filter((ecosystemName) =>
      this.ecosystems[ecosystemName].currencyType.includes(currencyType),
    );
  }

  static getName(chain: string | ChainTypes.IChain): string {
    if (typeof chain === 'string') return chain.toLowerCase();
    return chain.name;
  }

  /**
   * Gets a supported chain from its name or ID
   */
  protected fromGeneric<T extends readonly ChainTypes.ECOSYSTEM[]>(
    propertyName: 'id' | 'name',
    propertyValue: string,
    ecosystemsFilter?: T,
  ): ChainTypes.ChainTypeByEcosystem[T[number]] {
    const chains = this.chains.filter(
      (chain) =>
        chain[propertyName] === propertyValue &&
        (ecosystemsFilter ? ecosystemsFilter.includes(chain.ecosystem) : true),
    );
    if (chains.length < 1) {
      throw new Error(
        `No chain found with "${propertyName}=${propertyValue}" for ecosystem(s) "${ecosystemsFilter}"`,
      );
    }
    if (chains.length > 1) {
      throw new Error(
        `There is more than one chain with "${propertyName}=${propertyValue}" for ecosystem(s) "${ecosystemsFilter}"`,
      );
    }
    return chains[0] as ChainTypes.ChainTypeByEcosystem[T[number]];
  }

  /**
   * Gets a supported chain from its name
   */
  fromName<T extends readonly ChainTypes.ECOSYSTEM[]>(
    chainName: string,
    ecosystemsFilter?: T,
  ): ChainTypes.ChainTypeByEcosystem[T[number]] {
    return this.fromGeneric('name', chainName, ecosystemsFilter);
  }

  /**
   * Gets a supported chain from its ID
   */
  fromId<T extends readonly ChainTypes.ECOSYSTEM[]>(
    chainId: string,
    ecosystemsFilter?: T,
  ): ChainTypes.ChainTypeByEcosystem[T[number]] {
    return this.fromGeneric('id', chainId, ecosystemsFilter);
  }

  static getDefault(): ChainManager {
    if (this.defaultInstance) return this.defaultInstance;

    this.defaultInstance = new ChainManager();
    return this.defaultInstance;
  }

  /**
   * Returns true if both chains are equal or aliases.
   * The third argument "chainsEcosystem" is only needed when comparing chains as strings.
   */
  isSameChain = (
    chain1: string | ChainTypes.IChain,
    chain2: string | ChainTypes.IChain,
    chainsEcosystem?: readonly ChainTypes.ECOSYSTEM[],
  ): boolean => {
    const chain1Object =
      typeof chain1 === 'string' ? this.fromName(chain1, chainsEcosystem) : chain1;
    const chain2Object =
      typeof chain2 === 'string' ? this.fromName(chain2, chainsEcosystem) : chain2;
    return chain1Object.eq(chain2Object);
  };
}
