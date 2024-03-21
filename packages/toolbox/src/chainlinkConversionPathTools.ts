import { ethers, providers } from 'ethers';
import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { getDefaultProvider, parseLogArgs } from '@requestnetwork/payment-detection';
import {
  ChainlinkConversionPath,
  ChainlinkConversionPath__factory,
} from '@requestnetwork/smart-contracts/types';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { retry } from '@requestnetwork/utils';
import { ChainTypes } from '@requestnetwork/types';
import { ChainManager } from '@requestnetwork/chain/src';

export interface IOptions {
  network?: string;
  currencyCode?: string;
  web3Url?: string;
  maxRange?: number;
}

/** TransferWithReference event */
type AggregatorUpdatedArgs = {
  _input: string;
  _output: string;
  _aggregator: string;
};

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
class ChainlinkConversionPathTools {
  public chainLinkConversionPath: ChainlinkConversionPath;
  public creationBlockNumber: number;
  public provider: ethers.providers.Provider;
  private maxRange: number;

  /**
   * @param network The Ethereum network to use
   */
  constructor(
    private network: ChainTypes.IEvmChain,
    options?: { web3Url?: string; lastBlock?: number; maxRange?: number },
  ) {
    const web3Url =
      options?.web3Url ||
      (getDefaultProvider(this.network) as providers.JsonRpcProvider).connection.url;

    // Creates a local or default provider
    this.provider = new providers.StaticJsonRpcProvider(web3Url);

    // Setup the conversion proxy contract interface
    this.chainLinkConversionPath = ChainlinkConversionPath__factory.connect(
      chainlinkConversionPath.getAddress(network.name),
      this.provider,
    );

    this.creationBlockNumber = chainlinkConversionPath.getCreationBlockNumber(this.network.name);

    this.maxRange = options?.maxRange || 1000000;
  }

  /**
   * Retrieves all the aggregators
   */
  public async getAggregators(): Promise<Record<string, Record<string, string>>> {
    const lastBlock = await this.provider.getBlockNumber();
    let currentBlock = this.creationBlockNumber;

    // Get the fee proxy contract event logs
    const logs = [];
    while (currentBlock <= lastBlock) {
      const nextBlock = currentBlock + this.maxRange;
      console.error(
        `Fetching logs from ${currentBlock} to ${nextBlock} (progress: ${Math.round(
          (currentBlock * 100) / lastBlock,
        )}%)`,
      );
      const chunkLogs = await retry(
        this.chainLinkConversionPath.queryFilter.bind(this.chainLinkConversionPath),
        {
          maxRetries: 3,
          retryDelay: 2000,
        },
      )(this.chainLinkConversionPath.filters.AggregatorUpdated(), currentBlock, nextBlock);
      logs.push(...chunkLogs);
      currentBlock = nextBlock;
    }

    // Parses, filters and creates the events from the logs with the payment reference
    const aggregatorsMaps = logs.reduce(
      // Map: Input currency => Output currency => aggregator address
      (aggregators, log) => {
        const parsedLog = this.chainLinkConversionPath.interface.parseLog(log);
        const args = parseLogArgs<AggregatorUpdatedArgs>(parsedLog);

        // if the aggregator in 0x00 it means, it has been deleted
        if (args._aggregator === '0x0000000000000000000000000000000000000000') {
          aggregators.get(args._input)?.delete(args._output);
          if (aggregators.get(args._input)?.size === 0) {
            aggregators.delete(args._input);
          }
        } else {
          if (!aggregators.has(args._input)) {
            // if input  does not exists we just add it with the output currency
            aggregators.set(args._input, new Map([[args._output, args._aggregator]]));
          } else {
            // otherwise we just add a new output currency for this input currency
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            aggregators.get(args._input)!.set(args._output, args._aggregator);
          }
        }

        return aggregators;
      },
      new Map<string, Map<string, string>>(),
    );

    // From Map to Object to be easier to manipulate later
    const aggregatorsAsObject: Record<string, Record<string, string>> = {};
    aggregatorsMaps.forEach((elemL1: Map<string, string>, keyL1: string) => {
      aggregatorsAsObject[keyL1.toLocaleLowerCase()] = {};
      elemL1.forEach((aggregator: string, keyL2: string) => {
        aggregatorsAsObject[keyL1.toLocaleLowerCase()][keyL2.toLocaleLowerCase()] = aggregator;
      });
    });

    return aggregatorsAsObject;
  }
}

const getCurrency = (symbol: string) => {
  const currencyManager = CurrencyManager.getDefault();
  let currency = currencyManager.fromSymbol(symbol);
  if (!currency) {
    currency = currencyManager.from(symbol);
    if (!currency) {
      throw new UnsupportedCurrencyError(symbol);
    }
  }
  return currency;
};

export const listAggregators = async (options?: IOptions): Promise<void> => {
  let chains = [
    ChainManager.current().fromName('private', [ChainTypes.ECOSYSTEM.EVM]),
    ChainManager.current().fromName('goerli', [ChainTypes.ECOSYSTEM.EVM]),
    ChainManager.current().fromName('mainnet', [ChainTypes.ECOSYSTEM.EVM]),
  ];
  if (options?.network) {
    const chain = ChainManager.current().fromName(options.network, [ChainTypes.ECOSYSTEM.EVM]);
    chains = [chain];
  }

  // Create an Object to be used by a dijkstra algorithm to find the best path between two currencies
  const allAggregators: Record<string, Record<string, Record<string, string>>> = {};
  const aggregatorsNodesForDijkstra: Record<string, Record<string, Record<string, number>>> = {};
  for (const chain of chains) {
    allAggregators[chain.name] = {};
    const chainlinkConversionPathTools = new ChainlinkConversionPathTools(chain, options);
    allAggregators[chain.name] = await chainlinkConversionPathTools.getAggregators();

    // Include the reverse path of each aggregators
    aggregatorsNodesForDijkstra[chain.name] = {};
    for (let ccyIn in allAggregators[chain.name]) {
      ccyIn = ccyIn.toLowerCase();
      if (!aggregatorsNodesForDijkstra[chain.name][ccyIn]) {
        aggregatorsNodesForDijkstra[chain.name][ccyIn] = {};
      }
      for (let ccyOut in allAggregators[chain.name][ccyIn]) {
        ccyOut = ccyOut.toLowerCase();

        if (!aggregatorsNodesForDijkstra[chain.name][ccyOut]) {
          aggregatorsNodesForDijkstra[chain.name][ccyOut] = {};
        }
        aggregatorsNodesForDijkstra[chain.name][ccyIn][ccyOut] = 1;
        aggregatorsNodesForDijkstra[chain.name][ccyOut][ccyIn] = 1;
      }
    }
  }

  // logging to error so that the useful piece is written to stdout
  // enables this usage:  yarn -s chainlinkPath mainnet  | clip
  console.error('#####################################################################');
  console.error('All aggregators nodes (currency) :');
  console.error('../currency/src/conversion-aggregators.ts');
  console.log(JSON.stringify(aggregatorsNodesForDijkstra, null, 2));
};

export const showCurrencyHash = async (options?: IOptions): Promise<void> => {
  if (!options?.currencyCode) {
    throw new Error('currencyCode missing');
  }
  try {
    const currency = getCurrency(options.currencyCode);
    console.log('#####################################################################');
    console.log(`Currency hash of: ${options.currencyCode}`);
    console.log(currency.hash);
    console.log('#####################################################################');
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error ! ${e.message}`);
    }
  }
};
