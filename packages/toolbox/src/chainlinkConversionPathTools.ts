import { ethers } from 'ethers';
import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';
// import Utils from '@requestnetwork/utils';

// ABI fragment containing AggregatorUpdated event
const chainlinkConversionPathAbiFragment = [
  'event AggregatorUpdated(address _input, address _output, address _aggregator)'
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
    this.chainlinkConversionPathCreationBlockNumber = chainlinkConversionPath.getCreationBlockNumber(this.network)
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
    const aggregatorsMaps = logs.reduce((aggregators: Map<string, Map<string, string>>, log: any) => {
        const parsedLog = this.contractChainlinkConversionPath.interface.parseLog(log);

        if(parsedLog.values._aggregator === '0x0000000000000000000000000000000000000000') {
          aggregators.get(parsedLog.values._input)?.delete(parsedLog.values._output);
          if(aggregators.get(parsedLog.values._input)?.size === 0) {
            aggregators.delete(parsedLog.values._input);
          }
        } else {
          if(!aggregators.has(parsedLog.values._input)) {
            aggregators.set(parsedLog.values._input, new Map([[parsedLog.values._output, parsedLog.values._aggregator]]));
          } else {
            aggregators.get(parsedLog.values._input)!.set(parsedLog.values._output,parsedLog.values._aggregator);
          }
        }

        return aggregators;
      }, new Map());


      const aggregatorsAsObject : {[key: string]: { [key: string]: string}} = {}
      aggregatorsMaps.forEach((elemL1: Map<string,string>, keyL1: string) => {
        aggregatorsAsObject[keyL1.toLocaleLowerCase()] = {};
        elemL1.forEach((aggregator: string, keyL2: string) => {
          aggregatorsAsObject[keyL1.toLocaleLowerCase()][keyL2.toLocaleLowerCase()] = aggregator;
        });
      })

      return aggregatorsAsObject;
  }

}


(async () => {

  const networks = [
    'private',
    'rinkeby',
    // 'mainnet'
  ]

  const allAggregator: any = {};

  for(const network of networks) {
    allAggregator[network] = {};

    const chainlinkConversionPathTools = new ChainlinkConversionPathTools(network);
    allAggregator[network] = await chainlinkConversionPathTools.getAggregators();
  };


  console.log(allAggregator);
})();
