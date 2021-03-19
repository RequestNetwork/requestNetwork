// tslint:disable: no-magic-numbers

import { StorageTypes } from '@requestnetwork/types';
import EthereumUtils from '../src/ethereum-utils';

import * as config from '../src/config';
import GasPriceDefiner from '../src/gas-price-definer';

const bigNumber: any = require('bn.js');

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

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });

    it('returns  pricing for fast transaction in  xdai  payment', async () => {

      const gasPrice  = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.FAST,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );

      expect(gasPrice).toStrictEqual( [new bigNumber(100000000000)]);
    });


    it('returns default gas price from config if no response from api providing gas price ', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<typeof bigNumber> => [];


      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });


    it('returns the max of values returned by ethereum providers', async () => {
      
      const networkName = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)
      gasPriceDefiner.gasPriceListMap[networkName] = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(200),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(300),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(500),
          providerUrl: '',
        },
      ];

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe('500');
    });
  });

  describe('pollProviders', () => {
    it('returns the gas prices of each type in  xdai', async () => {
      
      let networkName = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI);

      let FastGasPrice  = await gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.FAST, networkName);

      let StandardGasPrice  = await gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD, networkName);
      expect(FastGasPrice).toEqual(
        [new bigNumber(100000000000)]
      );

      expect(StandardGasPrice).toEqual(
        [new bigNumber(50000000000)]
      );

      let lowGasPrice = await gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.SAFELOW, networkName);

      expect(lowGasPrice).toEqual(
      [new bigNumber(10000000000)]
      );


    });

    it('returns an array containing value from each provider of ethereum', async () => {
        let networkName : string = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);
      gasPriceDefiner.gasPriceListMap[networkName] = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(500),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(200),
          providerUrl: '',
        },
      ];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD, networkName),
      ).resolves.toEqual([
        new bigNumber(100),
        new bigNumber(500),
        new bigNumber(200),
      ]);
    });

    it('returns  empty array if there is no provider for the ethereum ', async () => {
      let networkName : string = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);

      gasPriceDefiner.gasPriceListMap[networkName] =[];
        await expect(
          gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.FAST, EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)),
        ).resolves.toHaveLength(0);


      

    });
  });
});
