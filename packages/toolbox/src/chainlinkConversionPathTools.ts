import { ethers } from 'ethers';
import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';

// ABI fragment containing AggregatorUpdated event
const chainlinkConversionPathAbiFragment = [
  'event AggregatorUpdated(address _input, address _output, address _aggregator)',
];

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
    this.provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the conversion proxy contract interface
    this.contractChainlinkConversionPath = new ethers.Contract(
      chainlinkConversionPath.getAddress(this.network),
      chainlinkConversionPathAbiFragment,
      this.provider,
    );
    this.chainlinkConversionPathCreationBlockNumber = chainlinkConversionPath.getCreationBlockNumber(
      this.network,
    );
  }

  /**
   * Retrieves all the aggregators
   */
  public async getAggregators(): Promise<any> {
    // Create a filter to find all the Fee Transfer logs with the payment reference
    const conversionFilter = this.contractChainlinkConversionPath.filters.AggregatorUpdated() as ethers.providers.Filter;
    conversionFilter.fromBlock = this.chainlinkConversionPathCreationBlockNumber;
    conversionFilter.toBlock = 'latest';

    // Get the fee proxy contract event logs
    const logs = await this.provider.getLogs(conversionFilter);

    // Parses, filters and creates the events from the logs with the payment reference
    const aggregatorsMaps = logs.reduce(
      // Map: Input currency => Output currency => aggregator address
      (aggregators: Map<string, Map<string, string>>, log: any) => {
        const parsedLog = this.contractChainlinkConversionPath.interface.parseLog(log);

        // if the aggregator in 0x00 it means, it has been deleted
        if (parsedLog.values._aggregator === '0x0000000000000000000000000000000000000000') {
          aggregators.get(parsedLog.values._input)?.delete(parsedLog.values._output);
          if (aggregators.get(parsedLog.values._input)?.size === 0) {
            aggregators.delete(parsedLog.values._input);
          }
        } else {
          if (!aggregators.has(parsedLog.values._input)) {
            // if input  does not exists we just add it with the output currency
            aggregators.set(
              parsedLog.values._input,
              new Map([[parsedLog.values._output, parsedLog.values._aggregator]]),
            );
          } else {
            // otherwise we just add a new output currency for this input currency
            aggregators
              .get(parsedLog.values._input)!
              .set(parsedLog.values._output, parsedLog.values._aggregator);
          }
        }

        return aggregators;
      },
      new Map(),
    );

    // From Map to Object to be easier to manipulate later
    const aggregatorsAsObject: { [key: string]: { [key: string]: string } } = {};
    aggregatorsMaps.forEach((elemL1: Map<string, string>, keyL1: string) => {
      aggregatorsAsObject[keyL1.toLocaleLowerCase()] = {};
      elemL1.forEach((aggregator: string, keyL2: string) => {
        aggregatorsAsObject[keyL1.toLocaleLowerCase()][keyL2.toLocaleLowerCase()] = aggregator;
      });
    });

    return aggregatorsAsObject;
  }
}

// tslint:disable:no-floating-promises
(async () => {
  const networks = [
    'private',
    'rinkeby',
    // Need to be added after the mainnet deployment
    // 'mainnet'
  ];

  // Create an Object to be used by a dijkstra algorithm to find the best path between two currencies
  const allAggregators: any = {};
  const aggregatorsNodesForDijkstra: any = {};
  for (const network of networks) {
    allAggregators[network] = {};
    const chainlinkConversionPathTools = new ChainlinkConversionPathTools(network);
    allAggregators[network] = await chainlinkConversionPathTools.getAggregators();

    // Include the reverse path of each aggregators
    aggregatorsNodesForDijkstra[network] = {};
    // tslint:disable-next-line:forin
    for (let ccyIn in allAggregators[network]) {
      ccyIn = ccyIn.toLowerCase();
      if (!aggregatorsNodesForDijkstra[network][ccyIn]) {
        aggregatorsNodesForDijkstra[network][ccyIn] = {};
      }
      // tslint:disable-next-line:forin
      for (let ccyOut in allAggregators[network][ccyIn]) {
        ccyOut = ccyOut.toLowerCase();
        if (!aggregatorsNodesForDijkstra[network][ccyOut]) {
          aggregatorsNodesForDijkstra[network][ccyOut] = {};
        }
        aggregatorsNodesForDijkstra[network][ccyIn][ccyOut] = 1;
        aggregatorsNodesForDijkstra[network][ccyOut][ccyIn] = 1;
      }
    }
  }

  // tslint:disable:no-console
  console.log('#####################################################################');
  console.log('All aggregators:');
  console.log(allAggregators);
  console.log('#####################################################################');
  console.log('All aggregators nodes for currency pairs graph:');
  console.log(aggregatorsNodesForDijkstra);
  console.log('#####################################################################');
})();
