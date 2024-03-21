import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ChainAbstract } from './chain-abstract';

export abstract class EcosystemAbstract<ECOSYSTEM extends ChainTypes.ECOSYSTEM>
  implements ChainTypes.IEcosystem<ECOSYSTEM>
{
  constructor(
    public name: ECOSYSTEM,
    public chainClass: new (
      id: string,
      name: string,
      testnet?: boolean,
    ) => ChainTypes.ChainTypeByEcosystem[ECOSYSTEM],
    public chains: Record<string, ChainTypes.ChainTypeByEcosystem[ECOSYSTEM]>,
    public currencyTypes: RequestLogicTypes.CURRENCY[],
  ) {}

  get chainNames(): string[] {
    return Object.keys(this.chains);
  }

  /**
   * Check if chainName lives amongst the list of supported chains by this chain type.
   * Throws in the case it's not supported.
   */
  public assertChainNameSupported(chainName?: string): asserts chainName is string {
    if (!this.isChainSupported(chainName)) throw new Error(`Unsupported chain ${chainName}`);
  }

  /**
   * Check if chainName lives amongst the list of supported chains by this chain type.
   * Throws in the case it's not supported.
   */
  public assertChainSupported(
    chain?: ChainTypes.IChain,
  ): asserts chain is ChainTypes.ChainTypeByEcosystem[ECOSYSTEM] {
    if (!this.isChainSupported(chain)) throw new Error(`Unsupported chain ${chain?.name}`);
  }

  /**
   * Check if chainName lives amongst the list of supported chains by this chain type.
   */
  public isChainSupported(chainName?: string | ChainAbstract): boolean {
    return (
      !!chainName &&
      this.chainNames.includes(chainName instanceof ChainAbstract ? chainName.name : chainName)
    );
  }

  /**
   * @returns true if both chains have the same ID or same name
   */
  public isSameChainFromString = (chain1: string, chain2: string): boolean => {
    try {
      this.assertChainNameSupported(chain1);
      this.assertChainNameSupported(chain2);
    } catch {
      return false;
    }
    const chain1Object = this.chains[chain1];
    const chain2Object = this.chains[chain2];
    return chain1Object.eq(chain2Object);
  };
}
