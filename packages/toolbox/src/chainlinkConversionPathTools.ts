import { ethers } from 'ethers';
import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { getDefaultProvider, parseLogArgs } from '@requestnetwork/payment-detection';
import { ChainlinkConversionPath__factory } from '@requestnetwork/smart-contracts/types';
import { Currency } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import iso4217 from '@requestnetwork/currency/dist/iso4217';

export interface IOptions {
  network?: string;
  currencyCode?: string;
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
  public contractChainlinkConversionPath: ethers.Contract;
  public chainlinkConversionPathCreationBlockNumber: number;
  public provider: ethers.providers.Provider;

  /**
   * @param network The Ethereum network to use
   */
  constructor(private network: string) {
    // Creates a local or default provider
    this.provider = getDefaultProvider(this.network);

    // Setup the conversion proxy contract interface
    this.contractChainlinkConversionPath = ChainlinkConversionPath__factory.connect(
      chainlinkConversionPath.getAddress(network),
      this.provider,
    );

    this.chainlinkConversionPathCreationBlockNumber = chainlinkConversionPath.getCreationBlockNumber(
      this.network,
    );
  }

  /**
   * Retrieves all the aggregators
   */
  public async getAggregators(): Promise<Record<string, Record<string, string>>> {
    // Get the fee proxy contract event logs
    const logs = await this.contractChainlinkConversionPath.queryFilter(
      this.contractChainlinkConversionPath.filters.AggregatorUpdated(),
      this.chainlinkConversionPathCreationBlockNumber,
      'latest',
    );

    // Parses, filters and creates the events from the logs with the payment reference
    const aggregatorsMaps = logs.reduce(
      // Map: Input currency => Output currency => aggregator address
      (aggregators, log) => {
        const parsedLog = this.contractChainlinkConversionPath.interface.parseLog(log);
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

// Record currency [currency hash] => {value (address or symbol), type}
const knownCurrencies = [...iso4217.map((x) => x.code), 'ETH'].reduce((prev, symbol) => {
  const currency = Currency.fromSymbol(symbol);
  return {
    ...prev,
    [currency.getHash().toLowerCase()]: {
      value: currency.value,
      type: currency.type,
    },
  };
}, {} as Record<string, { value: string; type: RequestLogicTypes.CURRENCY }>);

const addSupportedCurrency = (
  ccy: string,
  record: Record<RequestLogicTypes.CURRENCY, string[]>,
) => {
  const wellKnown = knownCurrencies[ccy];
  const address = wellKnown ? wellKnown.value : ccy;
  const type = wellKnown ? wellKnown.type : RequestLogicTypes.CURRENCY.ERC20;
  if (!record[type].includes(address)) {
    record[type].push(address);
  }
  record[type] = record[type].sort();
};

export const listAggregators = async (options?: IOptions): Promise<void> => {
  const networks = options?.network ? [options.network] : ['private', 'rinkeby', 'mainnet'];

  // Create an Object to be used by a dijkstra algorithm to find the best path between two currencies
  const allAggregators: Record<string, Record<string, Record<string, string>>> = {};
  const aggregatorsNodesForDijkstra: Record<string, Record<string, Record<string, number>>> = {};
  const supportedCurrencies: Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> = {};
  for (const network of networks) {
    supportedCurrencies[network] = {
      [RequestLogicTypes.CURRENCY.ISO4217]: [],
      [RequestLogicTypes.CURRENCY.ERC20]: [],
      [RequestLogicTypes.CURRENCY.ETH]: [],
      [RequestLogicTypes.CURRENCY.BTC]: [],
    };
    allAggregators[network] = {};
    const chainlinkConversionPathTools = new ChainlinkConversionPathTools(network);
    allAggregators[network] = await chainlinkConversionPathTools.getAggregators();

    // Include the reverse path of each aggregators
    aggregatorsNodesForDijkstra[network] = {};
    for (let ccyIn in allAggregators[network]) {
      ccyIn = ccyIn.toLowerCase();
      addSupportedCurrency(ccyIn, supportedCurrencies[network]);
      if (!aggregatorsNodesForDijkstra[network][ccyIn]) {
        aggregatorsNodesForDijkstra[network][ccyIn] = {};
      }
      for (let ccyOut in allAggregators[network][ccyIn]) {
        ccyOut = ccyOut.toLowerCase();
        addSupportedCurrency(ccyOut, supportedCurrencies[network]);

        if (!aggregatorsNodesForDijkstra[network][ccyOut]) {
          aggregatorsNodesForDijkstra[network][ccyOut] = {};
        }
        aggregatorsNodesForDijkstra[network][ccyIn][ccyOut] = 1;
        aggregatorsNodesForDijkstra[network][ccyOut][ccyIn] = 1;
      }
    }
  }

  console.log('#####################################################################');
  console.log('All aggregators:');
  console.log(allAggregators);
  console.log('#####################################################################');
  console.log('All aggregators nodes (currency) :');
  console.log(aggregatorsNodesForDijkstra);
  console.log('#####################################################################');
  console.log('Supported currencies (advanced-logic) :');
  console.log(supportedCurrencies);
};

export const showCurrencyHash = async (options?: IOptions): Promise<void> => {
  if (!options?.currencyCode) {
    throw new Error('currencyCode missing');
  }
  console.log('#####################################################################');
  console.log(`Currency hash of: ${options.currencyCode}`);
  console.log(Currency.fromSymbol(options.currencyCode).getHash());
  console.log('#####################################################################');
};
