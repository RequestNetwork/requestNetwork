import * as config from './config';
import EthereumUtils from './ethereum-utils';
import EtherchainProvider from './gas-price-providers/etherchain-provider';
import EtherscanProvider from './gas-price-providers/etherscan-provider';
import EthGasStationProvider from './gas-price-providers/ethgasstation-provider';

import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

const bigNumber: any = require('bn.js');

/**
 * Determines the gas price to use depending on the used network
 * Polls gas price API providers if necessary
 */
export default class GasPriceDefiner {
  /**
   * List of gas price api provider to call to determine the used gas price
   * This array is left public for mocking purpose
   */
  public gasPriceProviderList: StorageTypes.IGasPriceProvider[] = [
    new EtherchainProvider(),
    new EthGasStationProvider(),
    new EtherscanProvider(),
  ];

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  /**
   * Constructor
   * @param logger Logger instance
   */
  public constructor(logger?: LogTypes.ILogger) {
    this.logger = logger || new Utils.SimpleLogger();
  }

  /**
   * Get the gas price to use for transaction sending
   *
   * @param type Gas price type (fast, standard or safe low)
   * @param networkName Name of the Ethereum network used that can influence the way to get the gas price
   * @returns Big number representing the gas price to use
   */
  public async getGasPrice(type: StorageTypes.GasPriceType, networkName: string): Promise<string> {
    if (
      networkName ===
      EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)
    ) {
      const gasPriceArray: Array<typeof bigNumber> = await this.pollProviders(type);

      if (gasPriceArray.length > 0) {
        // Get the highest gas price from the providers
        return gasPriceArray
          .reduce(
            (currentMax, gasPrice: typeof bigNumber) => bigNumber.max(currentMax, gasPrice),
            new bigNumber(0),
          )
          .toString();
      } else {
        this.logger.warn('Cannot determine gas price: There is no available gas price provider', [
          'ethereum',
        ]);
      }
    }

    return config.getDefaultEthereumGasPrice();
  }

  /**
   * Get all gas prices from the APIs
   * If request to the API fails, no value is added to the array
   *
   * @param type Gas price type (fast, standard or safe low)
   * @returns Array containing each gas price
   */
  public async pollProviders(type: StorageTypes.GasPriceType): Promise<Array<typeof bigNumber>> {
    const gasPriceArray: Array<typeof bigNumber> = [];

    for (const gasPriceProvider of this.gasPriceProviderList) {
      try {
        // Get the gas price from the provider
        const providerGasPrice = await gasPriceProvider.getGasPrice(type);
        gasPriceArray.push(providerGasPrice);
      } catch (err) {
        // If the function throws, it means the gas price provider is not available or the value sent is not valid
        this.logger.warn(err, ['ethereum', 'gas']);
      }
    }

    return gasPriceArray;
  }
}
