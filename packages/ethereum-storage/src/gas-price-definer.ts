import * as config from './config';
import EthereumUtils from './ethereum-utils';
import EtherchainProvider from './gas-price-providers/etherchain-provider';
import EtherscanProvider from './gas-price-providers/etherscan-provider';
import EthGasStationProvider from './gas-price-providers/ethgasstation-provider';
import XdaiGasPriceProvider from './gas-price-providers/Xdai-provider';
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
   *
   */

  /**public gasPriceProviderList: StorageTypes.IGasPriceProvider[] = [
   new EtherchainProvider(),
   new EthGasStationProvider(),
   new EtherscanProvider(),
   new XdaiGasPriceProvider(),
 ];  */
  // public GasPriceListMap: Map<
  //   string,
  //   Array<StorageTypes.IGasPriceProvider>
  // > = new Map([
  //   [
  //     'ETHEREUM',
  //     [
  //       new EtherchainProvider(),
  //       new EthGasStationProvider(),
  //       new EtherscanProvider()
  //     ]
  //   ],
  //   ['XDAI', [new XdaiGasPriceProvider()]]
  // ]);

  private ethereumGasProvider: Array<StorageTypes.IGasPriceProvider> =  [
        new EtherchainProvider(),
        new EthGasStationProvider(),
        new EtherscanProvider()
      ];

  public GasPriceListMap: any = {
    mainnet: this.ethereumGasProvider,
    rinkeby: this.ethereumGasProvider,
    xdai: [new XdaiGasPriceProvider()],
  }

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
  public async getGasPrice(
    type: StorageTypes.GasPriceType,
    networkName: string
  ): Promise<string | undefined> {
    if (
      networkName ===
      EthereumUtils.getEthereumNetworkNameFromId(
        StorageTypes.EthereumNetwork.MAINNET
      )
    ) {
      const gasPriceArray: Array<typeof bigNumber> = await this.pollProviders(
        type,
        networkName
      );
      if (gasPriceArray.length > 0) {
        // Get the highest gas price from the providers
        return gasPriceArray
          .reduce(
            (currentMax, gasPrice: typeof bigNumber) =>
              bigNumber.max(currentMax, gasPrice),
            new bigNumber(0)
          )
          .toString();
      } else {
        this.logger.warn(
          'Cannot determine gas price: There is no available gas price provider',
          ['ethereum']
        );
      }
    } else if (
      networkName ===
      EthereumUtils.getEthereumNetworkNameFromId(
        StorageTypes.EthereumNetwork.XDAI
      )
    ) {
      const gasPrice: typeof bigNumber = await this.pollProviders(
        type,
        networkName
      );
      if (gasPrice.length > 0) {
        return gasPrice;
      } else {
        this.logger.warn('Not able to parse the gas fees correctly', ['xdai']);
      }
    }
    return config.getDefaultEthereumGasPrice();
  }
  /**
   * Get all gas prices from the APIs
   * If request to the API fails, no value is added to the array
   *
   * @param type Gas price type (fast, standard or safe low).
   * @param networkName for verifying  whether on ethereum mainnet or xdai , so as to provide reference gasPrice array
   * @param gasPriceArray returns the gas fees (as an array ) based on the network
   *  @returns Array containing each gas price
   */
  public async pollProviders(
    type: StorageTypes.GasPriceType,
    networkName: string
  ): Promise<Array<typeof bigNumber>> {
    const gasPriceArray: Array<typeof bigNumber> = [];
    // here we will have to push the gaspice based on the type of network only

    const providerList = this.GasPriceListMap[networkName];
    if(!providerList) {
      throw Error('network not supported')
    }


    for (let providerGasPrice of providerList) {
      try {
        gasPriceArray.push(await providerGasPrice.getGasPrice(type));
      } catch (err) {
        this.logger.warn(err, ['ethereum', 'gas']);
      }
    }
    return gasPriceArray;
  }
}
