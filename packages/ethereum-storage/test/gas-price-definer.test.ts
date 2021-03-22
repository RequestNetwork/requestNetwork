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
    it('returns default gas price from config if network is  ethereum testnet', async () => {
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      );

      expect(new BigNumber(gasPrice)).toEqual(new BigNumber(config.getDefaultEthereumGasPrice()));
    });

    it('returns  pricing for default transaction in  xdai  payment', async () => {

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );

      expect(new BigNumber(gasPrice)).toBe(new BigNumber(config.getDefaultXDaiGasPrice()));
    });


    it('returns default gas price from config if no response from api providing gas price ', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<BigNumber[]> => Promise.resolve([]);
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(new BigNumber(gasPrice)).toEqual(new BigNumber(config.getDefaultEthereumGasPrice()));
    });


    it('returns the max of values returned by ethereum providers', async () => {

      const networkName = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)
      gasPriceDefiner.gasPriceListMap[networkName] = [
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
            new BigNumber(500),
          providerUrl: '',
        },
      ];

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toEqual(new BigNumber(500));
    });
  });

  describe('pollProviders', () => {
    it('returns the gas prices of each type in  xdai', async () => {
      let networkName: string = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI);
      gasPriceDefiner.gasPriceListMap[networkName] = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(1),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(5),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<BigNumber> =>
            new BigNumber(10),
          providerUrl: '',
        },

      ];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD, networkName),
      ).resolves.toEqual([
        new BigNumber(1),
        new BigNumber(5),
        new BigNumber(10),
      ]);
    });

    it('returns an array containing value from each provider of ethereum', async () => {
      let networkName: string = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);
      gasPriceDefiner.gasPriceListMap[networkName] = [
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
      ];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD, networkName),
      ).resolves.toEqual([
        new BigNumber(100),
        new BigNumber(500),
        new BigNumber(200),
      ]);
    });

    it('returns  empty array if there is no provider for the ethereum ', async () => {
      let networkName: string = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);

      gasPriceDefiner.gasPriceListMap[networkName] = [];
      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.FAST, EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)),
      ).resolves.toHaveLength(0);




    });
  });
});
