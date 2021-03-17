// tslint:disable: no-magic-numbers

import { StorageTypes } from '@requestnetwork/types';
import EthereumUtils from '../src/ethereum-utils';

import * as config from '../src/config';
import GasPriceDefiner from '../src/gas-price-definer';

import * as BigNumber from 'bn.js';

let gasPriceDefiner: GasPriceDefiner;

describe('GasPriceDefiner', () => {
  beforeEach(() => {
    gasPriceDefiner = new GasPriceDefiner();
  });

  describe('getGasPrice', () => {
    it('returns default gas price from config if network is not mainnet', async () => {
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      );

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });

    it('returns default gas price from config if no provider is available', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<BigNumber[]> => Promise.resolve([]);
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });

    it('returns the max of values returned by providers', async () => {
      gasPriceDefiner.gasPriceProviderList = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(200),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(300),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(40),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(300),
          providerUrl: '',
        },
      ];

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe('300');
    });
  });

  describe('pollProviders', () => {
    it('returns an array containing value from each provider', async () => {
      gasPriceDefiner.gasPriceProviderList = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(500),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(200),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(300000),
          providerUrl: '',
        },
      ];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual([
        new BigNumber(100),
        new BigNumber(500),
        new BigNumber(200),
        new BigNumber(300000),
      ]);
    });

    it('returns empty array if there is no provider', async () => {
      gasPriceDefiner.gasPriceProviderList = [];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toHaveLength(0);
    });
  });
});
