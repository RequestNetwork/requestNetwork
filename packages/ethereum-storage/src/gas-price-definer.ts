import * as config from './config';
import EthereumUtils from './ethereum-utils';
import EtherchainProvider from './gas-price-providers/etherchain-provider';
import EtherscanProvider from './gas-price-providers/etherscan-provider';
import EthGasStationProvider from './gas-price-providers/ethgasstation-provider';

import { LogTypes, StorageTypes } from '@requestnetwork/types';

import { BigNumber } from 'ethers';
import XDaiFixedProvider from './gas-price-providers/xdai-fixed-provider';
import { GasDefinerProps } from './ethereum-storage-ethers';
import { SimpleLogger } from '@requestnetwork/utils';

/**
 * Determines the gas price to use depending on the used network
 * Polls gas price API providers if necessary
 */
export class GasPriceDefiner {
  private defaultProviders = [
    new EtherchainProvider(),
    new EthGasStationProvider(),
    new EtherscanProvider(),
  ];
  /**
   * List of gas price api provider to call to determine the used gas price
   * This array is left public for mocking purpose
   */
  public gasPriceProviderList: Partial<
    Record<StorageTypes.EthereumNetwork, StorageTypes.IGasPriceProvider[]>
  > = {
    [StorageTypes.EthereumNetwork.MAINNET]: this.defaultProviders,
    [StorageTypes.EthereumNetwork.XDAI]: [new XDaiFixedProvider()],
  };

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  private readonly gasPriceMin: BigNumber | undefined;

  /**
   * Constructor
   * @param logger Logger instance
   * @param gasPriceMin Minimum gas price to return
   */
  public constructor({
    logger,
    gasPriceMin,
  }: GasDefinerProps & { logger?: LogTypes.ILogger } = {}) {
    this.logger = logger || new SimpleLogger();
    this.gasPriceMin = gasPriceMin;
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
    networkName: string,
  ): Promise<BigNumber> {
    const network = EthereumUtils.getEthereumIdFromNetworkName(networkName);
    if (network) {
      const gasPriceArray = await this.pollProviders(type, network);
      if (gasPriceArray.length > 0) {
        // Get the highest gas price from the providers
        const gasPrice = gasPriceArray.reduce(
          (currentMax, gasPrice) => (currentMax.gt(gasPrice) ? currentMax : gasPrice),
          BigNumber.from(0),
        );
        return this.gasPriceMin && gasPrice.lt(this.gasPriceMin) ? this.gasPriceMin : gasPrice;
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
  public async pollProviders(
    type: StorageTypes.GasPriceType,
    network: StorageTypes.EthereumNetwork,
  ): Promise<Array<BigNumber>> {
    const providers = this.gasPriceProviderList[network] || [];
    const results = await Promise.all(
      providers.map((provider) =>
        provider.getGasPrice(type).catch((err) => this.logger.warn(err, ['ethereum', 'gas'])),
      ),
    );
    // use a type predicate to make typescript understand that the array cannot contain null
    const notNull = <T>(val: T | void | null): val is T => val !== null && val !== undefined;
    return results.filter(notNull);
  }
}
