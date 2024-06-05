import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { nativeCurrencies } from '../native';

export abstract class ChainsAbstract<
  CHAIN_NAME extends CurrencyTypes.ChainName,
  CHAIN extends CurrencyTypes.Chain,
  CHAIN_ID extends string | number,
> {
  public chains: Record<CHAIN_NAME, CHAIN>;
  public chainNames: CHAIN_NAME[];

  constructor(
    chains: Record<CHAIN_NAME, CHAIN>,
    currencyType: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC,
  ) {
    this.chains = chains;
    this.chainNames = Object.keys(chains) as CHAIN_NAME[];
    this.addNativeCurrenciesToChains(currencyType);
  }

  /**
   * Adds the native currency to the list of currencies supported by each chain
   */
  private addNativeCurrenciesToChains(
    currencyType: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC,
  ): void {
    this.chainNames.forEach((chainName) => {
      const nativeCurrency = (
        nativeCurrencies[currencyType] as CurrencyTypes.NamedNativeCurrency[]
      ).find((currency) => currency.network === chainName);
      if (nativeCurrency) {
        const chainCurrencies: CurrencyTypes.TokenMap = this.chains[chainName].currencies || {};
        chainCurrencies.native = nativeCurrency;
        this.chains[chainName].currencies = chainCurrencies;
      }
    });
  }

  /**
   * Check if chainName lives amongst the list of supported chains by this chain type.
   * Throws in the case it's not supported.
   */
  public assertChainSupported(chainName?: string): asserts chainName is CHAIN_NAME {
    if (!this.isChainSupported(chainName)) throw new Error(`Unsupported chain ${chainName}`);
  }

  /**
   * Check if chainName lives amongst the list of supported chains by this chain type.
   */
  public isChainSupported(chainName?: string): chainName is CHAIN_NAME {
    return !!chainName && (this.chainNames as string[]).includes(chainName);
  }

  /**
   * Retrieve the corresponding chain ID from Request Network's internal chain name representation
   */
  public getChainId(chainName: CHAIN_NAME): CHAIN_ID {
    return this.chains[chainName].chainId as CHAIN_ID;
  }

  /**
   * Retrieve Request Network's internal chain name representation from the corresponding chain ID
   */
  public getChainName(chainId: CHAIN_ID): CHAIN_NAME | undefined {
    return this.chainNames.find((chainName) => this.chains[chainName].chainId === chainId);
  }

  /**
   * Returns true is the chain is a testnet chain
   */
  public isTestnet(chainName: CHAIN_NAME): boolean {
    return Boolean(this.chains[chainName].testnet);
  }

  /**
   * @returns true if both chains have the same ID or same name
   */
  public isSameChain = (chain1: CHAIN_NAME, chain2: CHAIN_NAME): boolean => {
    return chain1 === chain2 || this.getChainId(chain1) === this.getChainId(chain2);
  };

  /**
   * @returns true if both chains have the same ID or same name
   */
  public isSameChainFromString = (chain1: string, chain2: string): boolean => {
    try {
      this.assertChainSupported(chain1);
      this.assertChainSupported(chain2);
    } catch {
      return false;
    }
    return this.isSameChain(chain1, chain2);
  };
}
